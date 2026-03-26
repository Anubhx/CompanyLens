"""
CompanyLens — Report Synthesiser
Takes all 3 agent outputs and produces the final due-diligence report via Gemini.
"""

import json
import logging
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from config import GEMINI_API_KEY
from llm_provider import get_llm

logger = logging.getLogger(__name__)

SYNTHESIS_PROMPT = """
You are a senior due-diligence analyst. Synthesise the following agent reports into a final assessment.

Company: {company}

=== LEGAL ANALYSIS ===
{legal_result}

=== FINANCIAL ANALYSIS ===
{finance_result}

=== ENGINEERING ANALYSIS ===
{dev_result}

Based on all available data, produce the final due-diligence report.

Return ONLY valid JSON with these exact keys (no markdown, no explanation):
{{
  "overall_score": <float 0-10, weighted average considering all available data>,
  "recommendation": "<GOOD TO PROCEED or PROCEED WITH CAUTION or DO NOT PROCEED>",
  "executive_summary": "<3-5 sentence executive summary covering all dimensions>",
  "legal_summary": {{
    "risk_level": "<from legal analysis or N/A>",
    "top_concerns": ["list of top legal concerns"]
  }},
  "financial_summary": {{
    "health_score": <from finance analysis>,
    "key_signals": ["list of key financial signals"]
  }},
  "engineering_summary": {{
    "eng_score": <from dev analysis or 0>,
    "highlights": ["list of engineering highlights"]
  }},
  "red_flags": ["list of ALL red flags across all dimensions"],
  "green_flags": ["list of ALL positive signals across all dimensions"]
}}

Scoring guidance:
- 8-10: Strong company, recommend proceeding
- 5-7: Mixed signals, proceed with caution
- 1-4: Significant concerns, do not recommend
- Weight financial health most heavily, then legal risk, then engineering
- If a dimension was skipped (no data), note it but don't penalize
"""


async def run_synthesiser(company: str, legal_result: dict | None,
                          finance_result: dict | None, dev_result: dict | None) -> dict:
    """
    Synthesise all agent outputs into a final report.
    """
    try:
        logger.info(f"Synthesiser: Generating final report for {company}...")

        llm = get_llm(temperature=0.2, agent_name="synthesiser")

        legal_str = json.dumps(legal_result, indent=2) if legal_result else "No legal analysis performed (no contract provided)"
        finance_str = json.dumps(finance_result, indent=2) if finance_result else "No financial analysis available"
        dev_str = json.dumps(dev_result, indent=2) if dev_result else "No engineering analysis performed (no GitHub org provided)"

        prompt = SYNTHESIS_PROMPT.format(
            company=company,
            legal_result=legal_str,
            finance_result=finance_str,
            dev_result=dev_str
        )

        response = await llm.ainvoke(prompt)
        response_text = response.content.strip()

        # Clean up markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        result = json.loads(response_text)

        # Ensure all required fields and add timestamp
        result.setdefault("overall_score", 5.0)
        result.setdefault("recommendation", "PROCEED WITH CAUTION")
        result.setdefault("executive_summary", f"Due diligence report for {company} completed.")
        result.setdefault("legal_summary", {"risk_level": "N/A", "top_concerns": []})
        result.setdefault("financial_summary", {"health_score": 5, "key_signals": []})
        result.setdefault("engineering_summary", {"eng_score": 0, "highlights": []})
        result.setdefault("red_flags", [])
        result.setdefault("green_flags", [])
        result["generated_at"] = datetime.utcnow().isoformat() + "Z"

        # Clamp overall score
        result["overall_score"] = round(max(0, min(10, float(result["overall_score"]))), 1)

        # Fix 4: Defensive green flag population if empty
        if not result.get("green_flags"):
            green_flags = []
            if finance_result and finance_result.get("health_score", 0) >= 7:
                green_flags.append(f"Strong financial health: {finance_result['health_score']}/10")
            if dev_result and dev_result.get("eng_score", 0) >= 7:
                green_flags.append(f"Strong engineering reputation: {dev_result['eng_score']}/10")
            
            result["green_flags"] = green_flags if green_flags else ["No exceptional positive signals detected"]

        logger.info(f"Synthesiser: Final score for {company} = {result['overall_score']}/10 → {result['recommendation']}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Synthesiser: JSON parse error: {e}")
        return _fallback_report(company, legal_result, finance_result, dev_result)
    except Exception as e:
        logger.error(f"Synthesiser failed: {e}")
        return _fallback_report(company, legal_result, finance_result, dev_result)


def _fallback_report(company: str, legal_result: dict | None,
                     finance_result: dict | None, dev_result: dict | None) -> dict:
    """Generate a basic report from raw agent data when synthesis fails."""
    scores = []
    if finance_result and finance_result.get("health_score"):
        scores.append(finance_result["health_score"])
    if dev_result and dev_result.get("eng_score"):
        scores.append(dev_result["eng_score"])

    avg_score = round(sum(scores) / len(scores), 1) if scores else 5.0

    recommendation = "GOOD TO PROCEED" if avg_score >= 7 else "PROCEED WITH CAUTION" if avg_score >= 4 else "DO NOT PROCEED"

    return {
        "overall_score": avg_score,
        "recommendation": recommendation,
        "executive_summary": f"Due diligence for {company} completed with partial synthesis. Review individual agent results for details.",
        "legal_summary": {"risk_level": legal_result.get("risk_level", "N/A") if legal_result else "N/A", "top_concerns": legal_result.get("red_flags", []) if legal_result else []},
        "financial_summary": {"health_score": finance_result.get("health_score", 5) if finance_result else 5, "key_signals": finance_result.get("signals", []) if finance_result else []},
        "engineering_summary": {"eng_score": dev_result.get("eng_score", 0) if dev_result else 0, "highlights": dev_result.get("highlights", []) if dev_result else []},
        "red_flags": (legal_result or {}).get("red_flags", []),
        "green_flags": [],
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
