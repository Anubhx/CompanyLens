"""
CompanyLens — GitHub API Tool
Fetches org metrics via GitHub REST API using httpx.
"""

import httpx
import logging
from datetime import datetime, timedelta
from config import GITHUB_TOKEN

logger = logging.getLogger(__name__)

BASE_URL = "https://api.github.com"


def _headers() -> dict:
    """Build request headers with optional auth token."""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "CompanyLens/1.0"
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


async def get_org_info(org: str) -> dict:
    """Get basic org information."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BASE_URL}/orgs/{org}", headers=_headers(), timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "name": data.get("name", org),
                    "description": data.get("description", ""),
                    "public_repos": data.get("public_repos", 0),
                    "followers": data.get("followers", 0),
                    "blog": data.get("blog", ""),
                }
            logger.warning(f"GitHub org info failed: {resp.status_code}")
            return {}
    except Exception as e:
        logger.error(f"GitHub org info error: {e}")
        return {}


async def get_org_repos(org: str, max_repos: int = 30) -> list[dict]:
    """Get top repos by stars for an org."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/orgs/{org}/repos",
                headers=_headers(),
                params={"sort": "stars", "direction": "desc", "per_page": max_repos, "type": "public"},
                timeout=15
            )
            if resp.status_code == 200:
                repos = resp.json()
                return [{
                    "name": r.get("name", ""),
                    "stars": r.get("stargazers_count", 0),
                    "forks": r.get("forks_count", 0),
                    "language": r.get("language", "Unknown"),
                    "open_issues": r.get("open_issues_count", 0),
                    "updated_at": r.get("updated_at", ""),
                    "description": r.get("description", ""),
                    "archived": r.get("archived", False),
                } for r in repos if not r.get("fork", False)]
            logger.warning(f"GitHub repos failed: {resp.status_code}")
            return []
    except Exception as e:
        logger.error(f"GitHub repos error: {e}")
        return []


async def get_recent_commits(org: str, repo_name: str) -> int:
    """Get commit count for last 90 days on a repo."""
    try:
        since = (datetime.utcnow() - timedelta(days=90)).isoformat() + "Z"
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/repos/{org}/{repo_name}/commits",
                headers=_headers(),
                params={"since": since, "per_page": 100},
                timeout=15
            )
            if resp.status_code == 200:
                return len(resp.json())
            return 0
    except Exception as e:
        logger.error(f"GitHub commits error: {e}")
        return 0


async def get_org_metrics(org: str) -> dict:
    """
    Fetch comprehensive GitHub org metrics.
    This is the main function called by the Dev Scout agent.
    """
    logger.info(f"Fetching GitHub metrics for org: {org}")

    org_info = await get_org_info(org)
    repos = await get_org_repos(org, max_repos=20)

    if not repos:
        return {
            "org": org,
            "error": f"No public repos found for org '{org}' or org does not exist",
            "total_repos": 0,
        }

    # Aggregate metrics
    total_stars = sum(r["stars"] for r in repos)
    total_forks = sum(r["forks"] for r in repos)
    total_issues = sum(r["open_issues"] for r in repos)

    # Language breakdown
    languages = {}
    for r in repos:
        lang = r.get("language") or "Unknown"
        languages[lang] = languages.get(lang, 0) + 1
    top_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:5]

    # Recent activity — check top 3 repos
    recent_commits = 0
    for repo in repos[:3]:
        commits = await get_recent_commits(org, repo["name"])
        recent_commits += commits

    # Top repos by stars
    top_repos = [{"name": r["name"], "stars": r["stars"], "language": r["language"]}
                 for r in repos[:5]]

    # Check for recently updated repos (active in last 30 days)
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    active_repos = [r for r in repos if r.get("updated_at", "") > thirty_days_ago]

    metrics = {
        "org": org,
        "org_name": org_info.get("name", org),
        "description": org_info.get("description", ""),
        "total_public_repos": org_info.get("public_repos", len(repos)),
        "total_stars": total_stars,
        "total_forks": total_forks,
        "total_open_issues": total_issues,
        "recent_commits_90d": recent_commits,
        "top_languages": [lang for lang, count in top_languages],
        "language_breakdown": {lang: count for lang, count in top_languages},
        "top_repos": top_repos,
        "active_repos_30d": len(active_repos),
        "archived_repos": sum(1 for r in repos if r.get("archived", False)),
        "followers": org_info.get("followers", 0),
    }

    logger.info(f"GitHub metrics for {org}: {metrics['total_public_repos']} repos, {total_stars} stars")
    return metrics
