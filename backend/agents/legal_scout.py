"""
CompanyLens — Legal Scout Agent
RAG pipeline: PDF → chunks → ChromaDB (local embeddings) → Gemini LLM → structured JSON.
Uses ChromaDB's built-in embedding function (all-MiniLM-L6-v2) to avoid Gemini /v1beta/ 404 errors.
Skips gracefully if no PDF is provided.
"""

import json
import logging
import chromadb
from chromadb.utils import embedding_functions
from tools.pdf_loader import extract_text_from_bytes, chunk_text
from config import GEMINI_API_KEY_LEGAL
from llm_provider import get_llm

logger = logging.getLogger(__name__)

LEGAL_EXTRACTION_PROMPT = """
You are a legal contract analyst. Based on the contract excerpts provided, extract:

1. LIABILITY CLAUSES: Any clauses limiting company liability
2. IP OWNERSHIP: Who owns work products, inventions, code
3. PAYMENT TERMS: Payment schedule, late fees, invoicing terms
4. TERMINATION: Notice periods, termination conditions, severance
5. NON-COMPETE / NON-SOLICITATION: Any restrictive covenants
6. RED FLAGS: Any unusual or concerning clauses

Return ONLY valid JSON with these exact keys (no markdown, no explanation):
{{
  "risk_level": "LOW or MEDIUM or HIGH",
  "red_flags": ["list of concerning items"],
  "ip_terms": "summary of IP ownership terms",
  "payment_terms": "summary of payment terms",
  "termination_terms": "summary of termination conditions",
  "non_compete": "summary of non-compete/non-solicitation terms",
  "summary": "2-3 sentence plain English summary of the contract's risk profile"
}}

Contract excerpts:
{context}
"""


async def run_legal_scout(contract_bytes: bytes | None = None, company: str = "") -> dict:
    """
    Run the Legal Scout agent.
    If no contract is provided, returns a 'skipped' result.
    Uses ChromaDB's built-in local embeddings (no Gemini API quota for embeddings).
    """
    if contract_bytes is None:
        logger.info("No contract provided — Legal Scout skipped")
        return {
            "risk_level": "N/A",
            "red_flags": [],
            "ip_terms": "No contract provided for analysis",
            "payment_terms": "No contract provided for analysis",
            "termination_terms": "No contract provided for analysis",
            "non_compete": "No contract provided for analysis",
            "summary": f"No contract was provided for {company}. Legal analysis was skipped."
        }

    try:
        # Step 1: Extract text from PDF
        logger.info("Legal Scout: Extracting text from PDF...")
        text = extract_text_from_bytes(contract_bytes)

        if not text.strip():
            return {
                "risk_level": "MEDIUM",
                "red_flags": ["PDF appears to be empty or image-based (no extractable text)"],
                "ip_terms": "Unable to extract",
                "payment_terms": "Unable to extract",
                "termination_terms": "Unable to extract",
                "non_compete": "Unable to extract",
                "summary": "The uploaded PDF did not contain extractable text. It may be an image-based PDF."
            }

        # Step 2: Chunk the text
        chunks = chunk_text(text, chunk_size=500, chunk_overlap=50)
        logger.info(f"Legal Scout: Created {len(chunks)} chunks")

        # Step 3: Embed into ChromaDB using local built-in embeddings (all-MiniLM-L6-v2).
        # This avoids any Gemini /v1beta/ API call entirely — no quota used for embeddings.
        logger.info("Legal Scout: Building vector store with local embeddings...")
        try:
            ef = embedding_functions.DefaultEmbeddingFunction()
            client = chromadb.Client()
            collection = client.create_collection(
                name="legal_temp",
                embedding_function=ef,
                get_or_create=True
            )
            collection.add(
                documents=chunks,
                ids=[str(i) for i in range(len(chunks))]
            )
        except Exception as embed_err:
            logger.error(f"Legal Scout: Embedding step failed: {embed_err}")
            raise

        # Step 4: Retrieve the most relevant chunks
        query = "liability IP ownership payment terms termination conditions non-compete red flags"
        results = collection.query(
            query_texts=[query],
            n_results=min(5, len(chunks))
        )
        relevant_docs = results["documents"][0] if results["documents"] else chunks[:5]
        context = "\n\n---\n\n".join(relevant_docs)
        logger.info(f"Legal Scout: Retrieved {len(relevant_docs)} relevant chunks")

        # Step 5: LLM analysis with Gemini
        llm = get_llm(temperature=0.1, agent_name="legal")
        prompt = LEGAL_EXTRACTION_PROMPT.format(context=context)
        response = await llm.ainvoke(prompt)
        response_text = response.content.strip()

        # Clean up markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Drop first line (```json or ```) and last line (```)
            response_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
            response_text = response_text.strip()

        result = json.loads(response_text)

        # Cleanup vector store
        try:
            client.delete_collection("legal_temp")
        except Exception:
            pass

        logger.info(f"Legal Scout: Analysis complete — risk level: {result.get('risk_level', 'UNKNOWN')}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Legal Scout: Failed to parse LLM response as JSON: {e}")
        return {
            "risk_level": "MEDIUM",
            "red_flags": ["Analysis encountered a parsing error — review contract manually"],
            "ip_terms": "Error during analysis",
            "payment_terms": "Error during analysis",
            "termination_terms": "Error during analysis",
            "non_compete": "Error during analysis",
            "summary": "Legal analysis encountered an error parsing the AI response. Please review the contract manually."
        }
    except Exception as e:
        logger.error(f"Legal Scout failed: {e}")
        return {
            "risk_level": "UNKNOWN",
            "red_flags": ["Contract analysis unavailable — backend service error. Review contract manually."],
            "ip_terms": "Analysis unavailable",
            "payment_terms": "Analysis unavailable",
            "termination_terms": "Analysis unavailable",
            "non_compete": "Analysis unavailable",
            "summary": "Legal analysis failed due to a backend service error. Please review the contract manually."
        }
