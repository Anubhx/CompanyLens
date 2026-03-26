import os
import logging

logger = logging.getLogger(__name__)

def get_llm(temperature=0.1, agent_name="general"):
    """
    Returns the LLM provider based on the ACTIVE_LLM environment variable.
    Defaults to Gemini if not set, but allows switching to Groq (Llama 3) for a free alternative.
    """
    provider = os.getenv("ACTIVE_LLM", "gemini").lower()
    
    if provider == "groq":
        from langchain_groq import ChatGroq
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.warning("ACTIVE_LLM is set to groq but GROQ_API_KEY is missing. Falling back to Gemini.")
            # Fallback to Gemini if groq key is missing
        else:
            logger.info("Using GROQ as the LLM provider (model: gemma2-9b-it)")

            return ChatGroq(
                model="llama-3.1-8b-instant", 
                api_key=api_key,
                temperature=temperature
            )
            
    # Default / Fallback: Google Gemini
    from langchain_google_genai import ChatGoogleGenerativeAI
    from config import GEMINI_API_KEY_LEGAL, GEMINI_API_KEY_FINANCE, GEMINI_API_KEY_DEV, GEMINI_API_KEY
    
    # Map agent name to specific API key to bypass rate limits
    if agent_name == "legal":
        key_to_use = GEMINI_API_KEY_LEGAL
    elif agent_name == "finance":
        key_to_use = GEMINI_API_KEY_FINANCE
    elif agent_name == "dev":
        key_to_use = GEMINI_API_KEY_DEV
    elif agent_name == "synthesiser":
        import random
        # Collect all valid keys and pick one randomly to distribute the synthesis load
        all_keys = [k for k in [GEMINI_API_KEY_LEGAL, GEMINI_API_KEY_FINANCE, GEMINI_API_KEY_DEV, GEMINI_API_KEY] if k]
        key_to_use = random.choice(all_keys) if all_keys else GEMINI_API_KEY
    else:
        key_to_use = GEMINI_API_KEY
        
    if not key_to_use:
        logger.error(f"No Gemini API key found for agent '{agent_name}'. Please set GEMINI_API_KEY in .env.")
        raise ValueError(f"GEMINI_API_KEY_{agent_name.upper()} missing.")
    
    logger.info(f"Using GEMINI as the LLM provider for agent '{agent_name}' (model: gemini-2.0-flash)")
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=key_to_use,
        temperature=temperature
    )
