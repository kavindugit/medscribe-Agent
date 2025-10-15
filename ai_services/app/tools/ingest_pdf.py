# app/tools/ingest_pdf.py
from typing import TypedDict
import fitz  # PyMuPDF
from app.tools.ingest_ocr import run_azure_ocr


class IngestResult(TypedDict):
    text: str
    pages: int
    ocr_used: bool


def read_pdf(binary: bytes) -> IngestResult:
    """Extract text from PDF using PyMuPDF."""
    doc = fitz.open(stream=binary, filetype="pdf")
    texts = [page.get_text("text") for page in doc]
    doc.close()
    full_text = "\n".join(texts)
    return {"text": full_text, "pages": len(texts), "ocr_used": False}


def ingest(binary: bytes, mime: str) -> IngestResult:
    """Unified entrypoint for text extraction."""
    if mime == "application/pdf":
        return read_pdf(binary)
    elif mime in {"image/png", "image/jpeg"}:
        # Use Azure OCR only
        return run_azure_ocr(binary)
    else:
        return {"text": "", "pages": 0, "ocr_used": False}
