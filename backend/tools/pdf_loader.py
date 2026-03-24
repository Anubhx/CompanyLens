"""
CompanyLens — PDF Loader Tool
Extracts text from PDF files using PyMuPDF and chunks for RAG.
"""

import fitz  # PyMuPDF
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        logger.info(f"Extracted {len(text)} characters from PDF: {pdf_path}")
        return text
    except Exception as e:
        logger.error(f"Failed to extract PDF text: {e}")
        raise


def extract_text_from_bytes(pdf_bytes: bytes) -> str:
    """Extract all text from PDF bytes (for uploaded files)."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        logger.info(f"Extracted {len(text)} characters from uploaded PDF")
        return text
    except Exception as e:
        logger.error(f"Failed to extract PDF text from bytes: {e}")
        raise


def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> list[str]:
    """Split text into chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = splitter.split_text(text)
    logger.info(f"Split text into {len(chunks)} chunks")
    return chunks
