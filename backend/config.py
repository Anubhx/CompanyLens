"""
CompanyLens — Configuration
Loads all API keys from .env file. Never hardcode keys.
"""

from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# Required (at least one key must be set)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Optional specific keys for each agent to bypass rate limits
GEMINI_API_KEY_LEGAL = os.getenv("GEMINI_API_KEY_LEGAL", GEMINI_API_KEY)
GEMINI_API_KEY_FINANCE = os.getenv("GEMINI_API_KEY_FINANCE", GEMINI_API_KEY)
GEMINI_API_KEY_DEV = os.getenv("GEMINI_API_KEY_DEV", GEMINI_API_KEY)

# Optional (agents skip gracefully if not set)
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if not TAVILY_API_KEY:
    logger.warning("TAVILY_API_KEY not set — Finance Analyst will use fallback mode")
if not GITHUB_TOKEN:
    logger.warning("GITHUB_TOKEN not set — GitHub API rate limit will be 60 req/hr")
