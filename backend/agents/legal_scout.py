"""
CompanyLens — Legal Scout Agent
RAG pipeline: PDF → chunks → embeddings → ChromaDB → Gemini LLM → structured JSON.
Skips gracefully if no PDF is provided.
"""

import json
import logging
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from tools.pdf_loader import extract_text_from_bytes, chunk_text
from config import GEMINI_API_KEY

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

        # Step 3: Create embeddings and vector store
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=GEMINI_API_KEY
        )

        vectorstore = Chroma.from_texts(
            texts=chunks,
            embedding=embeddings,
            collection_name="legal_temp"
        )

        # Step 4: Retrieve relevant chunks
        retriever = vectorstore.as_retriever(search_kwargs={"k": min(5, len(chunks))})
        relevant_docs = retriever.invoke(
            "Extract liability, IP ownership, payment terms, termination, non-compete clauses, and red flags"
        )
        context = "\n\n---\n\n".join([doc.page_content for doc in relevant_docs])

        # Step 5: LLM analysis
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.1
        )

        prompt = LEGAL_EXTRACTION_PROMPT.format(context=context)
        response = await llm.ainvoke(prompt)
        response_text = response.content.strip()

        # Clean up markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        result = json.loads(response_text)

        # Cleanup vector store
        try:
            vectorstore.delete_collection()
        except Exception:
            pass

        logger.info(f"Legal Scout: Analysis complete — risk level: {result.get('risk_level', 'UNKNOWN')}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Legal Scout: Failed to parse LLM response as JSON: {e}")
        return {
            "risk_level": "MEDIUM",
            "red_flags": ["Analysis encountered a parsing error"],
            "ip_terms": "Error during analysis",
            "payment_terms": "Error during analysis",
            "termination_terms": "Error during analysis",
            "non_compete": "Error during analysis",
            "summary": "Legal analysis encountered an error parsing the LLM response. Please try again."
        }
    except Exception as e:
        logger.error(f"Legal Scout failed: {e}")
        return {
            "risk_level": "MEDIUM",
            "red_flags": [f"Analysis error: {str(e)}"],
            "ip_terms": "Error during analysis",
            "payment_terms": "Error during analysis",
            "termination_terms": "Error during analysis",
            "non_compete": "Error during analysis",
            "summary": f"Legal analysis failed due to an error: {str(e)}"
        }
