"""
CompanyLens — Tavily Search Tool
Web search wrapper for the Finance Analyst agent.
"""

import logging
from tavily import TavilyClient
from config import TAVILY_API_KEY

logger = logging.getLogger(__name__)


async def search_web(query: str, max_results: int = 5) -> list[dict]:
    """
    Search the web using Tavily API.
    Returns a list of {title, url, content} dicts.
    """
    if not TAVILY_API_KEY:
        logger.warning("TAVILY_API_KEY not set — returning empty results")
        return []

    try:
        client = TavilyClient(api_key=TAVILY_API_KEY)
        response = client.search(query=query, max_results=max_results)
        results = []
        for r in response.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", "")
            })
        logger.info(f"Tavily search for '{query}' returned {len(results)} results")
        return results
    except Exception as e:
        logger.error(f"Tavily search failed: {e}")
        return []


async def search_company_finance(company: str) -> str:
    """
    Run multiple searches about a company's financial health.
    Returns concatenated search results as a string for LLM consumption.
    """
    queries = [
        f"{company} funding rounds investment 2024 2025",
        f"{company} layoffs hiring news 2024 2025",
        f"{company} revenue valuation financial health",
        f"{company} glassdoor employee reviews rating",
    ]

    all_results = []
    for query in queries:
        results = await search_web(query, max_results=3)
        for r in results:
            all_results.append(f"[{r['title']}]\n{r['content']}\nSource: {r['url']}")

    combined = "\n\n---\n\n".join(all_results)
    logger.info(f"Compiled {len(all_results)} search results for {company}")
    return combined if combined else f"No search results found for {company}. Provide a general analysis based on publicly known information."
