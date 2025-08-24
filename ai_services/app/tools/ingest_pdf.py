from typing import TypedDict
import fitz  # PyMuPDF

class IngestResult(TypedDict):
    text: str
    pages: int
    ocr_used: bool  # always False for now (we're not doing OCR yet)

def read_pdf(binary: bytes) -> IngestResult:
    # Open from memory buffer
    doc = fitz.open(stream=binary, filetype="pdf")
    texts = []
    for page in doc:
        # "text" extracts simple text content; good enough for step 1
        texts.append(page.get_text("text"))
    doc.close()
    all_text = "\n".join(texts)
    return {"text": all_text, "pages": len(texts), "ocr_used": False}

def read_image_placeholder(binary: bytes) -> IngestResult:
    # We'll replace this with Tesseract OCR in Step 2. For now, stub it.
    return {"text": "[image OCR not implemented yet]", "pages": 1, "ocr_used": True}

def ingest(binary: bytes, mime: str) -> IngestResult:
    if mime == "application/pdf":
        return read_pdf(binary)
    elif mime in {"image/png", "image/jpeg"}:
        return read_image_placeholder(binary)
    else:
        # Shouldn't happen because route already validates content_type
        return {"text": "", "pages": 0, "ocr_used": False}
