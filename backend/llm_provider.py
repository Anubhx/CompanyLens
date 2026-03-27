import os
import random
import logging

logger = logging.getLogger(__name__)


def get_llm(temperature=0.1, agent_name="general"):
    """
    Returns the LLM provider based on the ACTIVE_LLM environment variable.
    - ACTIVE_LLM=groq  → All agents (including synthesiser) use GROQ (free, 14,400 req/day).
    - ACTIVE_LLM=gemini (default) → Rotates Gemini keys per agent to spread quota.

    Key routing (Gemini mode):
      legal      → GEMINI_API_KEY_LEGAL
      finance    → GEMINI_API_KEY_FINANCE
      dev        → GEMINI_API_KEY_DEV
      synthesiser → random choice from all configured keys
      general    → GEMINI_API_KEY
    """
    provider = os.getenv("ACTIVE_LLM", "gemini").lower()

    # ── GROQ path ─────────────────────────────────────────────────────
    if provider == "groq":
        from langchain_groq import ChatGroq
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            # Use a stronger model for the synthesiser for better report quality
            model = "llama-3.1-8b-instant" if agent_name != "synthesiser" else "llama-3.1-8b-instant"
            logger.info(f"Using GROQ for agent '{agent_name}' (model: {model})")
            return ChatGroq(
                model=model,
                api_key=api_key,
                temperature=temperature
            )
        else:
            logger.warning("ACTIVE_LLM=groq but GROQ_API_KEY is missing — falling back to Gemini")
            # Fall through to Gemini below

    # ── Gemini path ───────────────────────────────────────────────────
    from langchain_google_genai import ChatGoogleGenerativeAI
    from config import GEMINI_API_KEY, GEMINI_API_KEY_LEGAL, GEMINI_API_KEY_FINANCE, GEMINI_API_KEY_DEV

    # Optional extra keys for synthesiser rotation (add to .env to increase quota headroom)
    GEMINI_API_KEY_5 = os.getenv("GEMINI_API_KEY_5")
    GEMINI_API_KEY_6 = os.getenv("GEMINI_API_KEY_6")

    # Map agent to its dedicated key
    if agent_name == "legal":
        key_to_use = GEMINI_API_KEY_LEGAL
    elif agent_name == "finance":
        key_to_use = GEMINI_API_KEY_FINANCE
    elif agent_name == "dev":
        key_to_use = GEMINI_API_KEY_DEV
    elif agent_name == "synthesiser":
        # Rotate across ALL available keys to spread the daily quota
        all_keys = [k for k in [
            GEMINI_API_KEY,
            GEMINI_API_KEY_LEGAL,
            GEMINI_API_KEY_FINANCE,
            GEMINI_API_KEY_DEV,
            GEMINI_API_KEY_5,
            GEMINI_API_KEY_6,
        ] if k]
        if not all_keys:
            raise ValueError("No Gemini API keys configured. Set GEMINI_API_KEY in .env.")
        key_to_use = random.choice(all_keys)
        logger.info(f"Synthesiser: selected 1 key from {len(all_keys)} available Gemini keys")
    else:
        key_to_use = GEMINI_API_KEY

    if not key_to_use:
        raise ValueError(
            f"No API key found for agent '{agent_name}'. "
            f"Set GEMINI_API_KEY (or GEMINI_API_KEY_{agent_name.upper()}) in .env."
        )

    logger.info(f"Using Gemini for agent '{agent_name}' (model: gemini-2.0-flash)")
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=key_to_use,
        temperature=temperature
    )
