import os
import logging

logger = logging.getLogger(__name__)

def get_llm(temperature=0.1):
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
            logger.info("Using GROQ as the LLM provider (model: llama3-70b-8192)")
            return ChatGroq(
                model="llama3-70b-8192", 
                api_key=api_key,
                temperature=temperature
            )
            
    # Default / Fallback: Google Gemini
    from langchain_google_genai import ChatGoogleGenerativeAI
    from config import GEMINI_API_KEY
    
    logger.info("Using GEMINI as the LLM provider (model: gemini-2.0-flash)")
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=temperature
    )
