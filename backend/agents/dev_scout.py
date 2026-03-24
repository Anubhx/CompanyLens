"""
CompanyLens — Dev Reputation Scout Agent
GitHub API metrics → Gemini LLM analysis → structured engineering health JSON.
"""

import json
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from tools.github_tool import get_org_metrics
from config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

ENG_ANALYSIS_PROMPT = """
You are an engineering culture analyst. Analyze this GitHub organization's engineering health:

{github_metrics_json}

Score and assess:
1. ACTIVITY: How actively are they shipping? (commits, PRs, recent updates)
2. QUALITY: Code review culture? Issue response time? Open issues ratio?
3. OPENNESS: Open source contributions? Community engagement? Stars?
4. STACK: Tech choices — modern or legacy? Language diversity?
5. TEAM SIZE SIGNAL: Contributor count, repo count, fork engagement

Return ONLY valid JSON with these exact keys (no markdown, no explanation):
{{
  "eng_score": <integer 1-10>,
  "activity_level": "<HIGH or MEDIUM or LOW>",
  "top_languages": ["list of top programming languages"],
  "open_source_culture": "<STRONG or MODERATE or MINIMAL>",
  "pr_velocity": "<FAST or NORMAL or SLOW>",
  "highlights": ["list of 3-5 notable observations about their engineering"],
  "summary": "<2-3 sentence summary of engineering reputation>"
}}

Important:
- eng_score should reflect overall engineering health (10 = world-class, 1 = concerning)
- Be specific in highlights — mention actual repos, languages, or metrics
- Include at least 3 highlights
"""


async def run_dev_scout(github_org: str | None = None, company: str = "") -> dict:
    """
    Run the Dev Scout agent.
    Fetches GitHub org metrics, then uses Gemini to analyze engineering health.
    Skips gracefully if no GitHub org is provided.
    """
    if not github_org:
        logger.info("No GitHub org provided — Dev Scout skipped")
        return {
            "eng_score": 0,
            "activity_level": "N/A",
            "top_languages": [],
            "open_source_culture": "N/A",
            "pr_velocity": "N/A",
            "highlights": [],
            "summary": f"No GitHub organization was provided for {company}. Engineering analysis was skipped."
        }

    try:
        logger.info(f"Dev Scout: Analyzing GitHub org '{github_org}'...")

        # Step 1: Fetch GitHub metrics
        metrics = await get_org_metrics(github_org)

        if metrics.get("error"):
            logger.warning(f"Dev Scout: {metrics['error']}")
            return {
                "eng_score": 0,
                "activity_level": "N/A",
                "top_languages": [],
                "open_source_culture": "N/A",
                "pr_velocity": "N/A",
                "highlights": [metrics["error"]],
                "summary": f"Could not analyze GitHub org '{github_org}': {metrics['error']}"
            }

        # Step 2: LLM analysis
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.2
        )

        prompt = ENG_ANALYSIS_PROMPT.format(
            github_metrics_json=json.dumps(metrics, indent=2)
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
        result.setdefault("eng_score", 5)
        result.setdefault("activity_level", "MEDIUM")
        result.setdefault("top_languages", metrics.get("top_languages", []))
        result.setdefault("open_source_culture", "MODERATE")
        result.setdefault("pr_velocity", "NORMAL")
        result.setdefault("highlights", [])
        result.setdefault("summary", f"Engineering analysis of {github_org} completed.")

        # Clamp score to valid range
        result["eng_score"] = max(1, min(10, int(result["eng_score"])))

        logger.info(f"Dev Scout: {github_org} eng score = {result['eng_score']}/10")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Dev Scout: JSON parse error: {e}")
        return {
            "eng_score": 5,
            "activity_level": "MEDIUM",
            "top_languages": [],
            "open_source_culture": "MODERATE",
            "pr_velocity": "NORMAL",
            "highlights": ["Analysis encountered a parsing error"],
            "summary": f"Engineering analysis of {github_org} encountered a parsing error."
        }
    except Exception as e:
        logger.error(f"Dev Scout failed: {e}")
        return {
            "eng_score": 5,
            "activity_level": "MEDIUM",
            "top_languages": [],
            "open_source_culture": "MODERATE",
            "pr_velocity": "NORMAL",
            "highlights": [f"Analysis error: {str(e)}"],
            "summary": f"Engineering analysis of {github_org} failed: {str(e)}"
        }
