"""
CompanyLens — Finance Analyst Agent
Web search via Tavily → Gemini LLM synthesis → structured financial health JSON.
"""

import json
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from tools.search_tool import search_company_finance
from config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

FINANCE_RESEARCH_PROMPT = """
You are a financial due-diligence analyst. Based on the search results below, analyze the company: {company}

Research findings:
{search_results}

Based on this information, provide a comprehensive financial health assessment.

Return ONLY valid JSON with these exact keys (no markdown, no explanation):
{{
  "health_score": <integer 1-10>,
  "funding_stage": "<e.g. Series A, Series B, Public, Bootstrapped, Unknown>",
  "last_funding": "<description of most recent funding round or 'Unknown'>",
  "layoff_risk": "<LOW or MEDIUM or HIGH>",
  "glassdoor_rating": <float like 4.2 or null if unknown>,
  "headcount_trend": "<GROWING or STABLE or SHRINKING>",
  "signals": ["list of key financial signals - both positive and negative"],
  "summary": "<2-3 sentence summary of financial health>"
}}

Important:
- health_score should reflect overall financial stability (10 = excellent, 1 = severe risk)
- Be honest about what is unknown vs what the data shows
- Include at least 3-5 signals
"""


async def run_finance_analyst(company: str) -> dict:
    """
    Run the Finance Analyst agent.
    Searches the web for company financial data, then synthesizes with Gemini.
    """
    try:
        logger.info(f"Finance Analyst: Researching {company}...")

        # Step 1: Search for financial information
        search_results = await search_company_finance(company)

        # Step 2: LLM synthesis
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.2
        )

        prompt = FINANCE_RESEARCH_PROMPT.format(
            company=company,
            search_results=search_results
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

        # Ensure required fields
        result.setdefault("health_score", 5)
        result.setdefault("funding_stage", "Unknown")
        result.setdefault("last_funding", "Unknown")
        result.setdefault("layoff_risk", "MEDIUM")
        result.setdefault("glassdoor_rating", None)
        result.setdefault("headcount_trend", "STABLE")
        result.setdefault("signals", [])
        result.setdefault("summary", f"Financial analysis of {company} completed.")

        # Clamp health_score to valid range
        result["health_score"] = max(1, min(10, int(result["health_score"])))

        logger.info(f"Finance Analyst: {company} health score = {result['health_score']}/10")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Finance Analyst: JSON parse error: {e}")
        return {
            "health_score": 5,
            "funding_stage": "Unknown",
            "last_funding": "Unknown",
            "layoff_risk": "MEDIUM",
            "glassdoor_rating": None,
            "headcount_trend": "STABLE",
            "signals": ["Analysis encountered a parsing error — results may be incomplete"],
            "summary": f"Financial analysis of {company} encountered a parsing error. Defaulting to neutral assessment."
        }
    except Exception as e:
        logger.error(f"Finance Analyst failed: {e}")
        return {
            "health_score": 5,
            "funding_stage": "Unknown",
            "last_funding": "Unknown",
            "layoff_risk": "MEDIUM",
            "glassdoor_rating": None,
            "headcount_trend": "STABLE",
            "signals": [f"Analysis error: {str(e)}"],
            "summary": f"Financial analysis of {company} failed due to an error: {str(e)}"
        }
