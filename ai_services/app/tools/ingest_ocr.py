# app/tools/ingest_ocr.py
import io
import os
import base64
import requests
from PIL import Image
from typing import TypedDict


class OCRResult(TypedDict):
    text: str
    pages: int
    ocr_used: bool


# 🔧 Azure OCR Configuration
AZURE_OCR_KEY = (os.getenv("AZURE_OCR_KEY") or "").strip()
AZURE_OCR_MODEL = (os.getenv("AZURE_OCR_MODEL") or "mistral-document-ai-2505").strip()
AZURE_OCR_URL = (os.getenv("AZURE_OCR_URL") or "").strip()  # Foundry endpoint


def _normalize_to_png_bytes(image_bytes: bytes) -> bytes:
    """Ensure image is normalized to PNG for better OCR results."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="PNG", optimize=True)
        return buf.getvalue()


def run_azure_ocr(image_bytes: bytes) -> OCRResult:
    """Perform OCR using Azure AI Foundry (mistral-document-ai-2505)."""
    if not AZURE_OCR_URL or not AZURE_OCR_KEY:
        raise RuntimeError("❌ Azure OCR credentials or endpoint not set in environment variables.")

    # Normalize + convert image to base64 string
    png_bytes = _normalize_to_png_bytes(image_bytes)
    b64_data = base64.b64encode(png_bytes).decode("utf-8")
    document_url = f"data:image/png;base64,{b64_data}"

    payload = {
        "model": AZURE_OCR_MODEL,
        "document": {
            "type": "document_url",
            "document_name": "uploaded_image",
            "document_url": document_url,
        },
    }

    headers = {
        "Authorization": f"Bearer {AZURE_OCR_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post(AZURE_OCR_URL, headers=headers, json=payload, timeout=90)
    except requests.RequestException as e:
        raise RuntimeError(f"🌐 Network error while calling Azure OCR: {e}")

    if not resp.ok:
        raise RuntimeError(f"❌ Azure OCR failed ({resp.status_code}): {resp.text[:300]}")

    data = resp.json()

    # Extract text from model output
    extracted_text = ""
    if isinstance(data, dict):
        extracted_text = (
            data.get("content")
            or data.get("text")
            or data.get("markdown", "")
            or str(data)
        ).strip()

    if not extracted_text:
        raise RuntimeError("⚠️ OCR returned no text (empty response).")

    return {"text": extracted_text, "pages": 1, "ocr_used": True}
