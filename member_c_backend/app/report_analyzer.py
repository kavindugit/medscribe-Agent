import os
import re
import json
import tempfile
from typing import List, Dict

import google.generativeai as genai
import chardet
from fastapi import UploadFile, HTTPException
from PyPDF2 import PdfReader
import docx
from dotenv import load_dotenv

# ---------- Load Env & Gemini Config ----------
load_dotenv()

MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")  # Default free-tier friendly
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise RuntimeError("GOOGLE_API_KEY is not set in environment variables.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(MODEL)

# ---------- Helpers ----------
def _safe_decode(raw: bytes) -> str:
    """Decode bytes → text safely with encoding detection."""
    if not raw:
        return ""
    detected = chardet.detect(raw)
    enc = detected.get("encoding") or "utf-8"
    try:
        return raw.decode(enc, errors="ignore")
    except Exception:
        return raw.decode("latin-1", errors="ignore")


def _extract_text_from_pdf(raw: bytes) -> str:
    """Extract text from a PDF file."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(raw)
        tmp_path = tmp.name
    try:
        reader = PdfReader(tmp_path)
        pages = [p.extract_text() or "" for p in reader.pages]
        return "\n".join(pages)
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


def _extract_text_from_docx(raw: bytes) -> str:
    """Extract text from a DOCX file."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        tmp.write(raw)
        tmp_path = tmp.name
    try:
        d = docx.Document(tmp_path)
        return "\n".join([p.text for p in d.paragraphs if p.text.strip()])
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


def _normalize_whitespace(s: str) -> str:
    """Clean up whitespace & null chars."""
    s = s.replace("\x00", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def _chunk(text: str, max_chars: int = 12000) -> List[str]:
    """Split long text into chunks to avoid token limits."""
    if len(text) <= max_chars:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        nl = text.rfind("\n", start, end)
        if nl == -1 or nl <= start + 2000:
            nl = end
        chunks.append(text[start:nl])
        start = nl
    return chunks


def _extract_json_candidate(s: str) -> Dict:
    """Try to parse JSON from Gemini response."""
    s = s.strip()
    fence = re.search(r"json\s*(\{.*\}|\[.*\])\s*", s, re.DOTALL | re.IGNORECASE)
    if fence:
        s = fence.group(1).strip()
    try:
        return json.loads(s)
    except Exception:
        pass
    brace = re.search(r"(\{.*\})", s, re.DOTALL)
    if brace:
        try:
            return json.loads(brace.group(1))
        except Exception:
            pass
    return {"raw": s}


def _gemini_prompt(chunk_text: str) -> str:
    """Prompt for Member C Agent tasks."""
    return f"""
You are the *Member C agent* for a medical report assistant. Your job:

1) Explain in plain language what the report means (no diagnosis).
2) Build a bilingual glossary (English + Sinhala) for technical terms.
3) Provide neutral, non-diagnostic lifestyle recommendations.
4) Add a clear disclaimer.
5) If you mention any numeric result, include a citation (quote exact line).

INPUT REPORT TEXT:
---
{chunk_text}
---

Return strict JSON in this shape:

{{
  "meaning": "string (2–5 sentences, plain language)",
  "glossary": [
    {{
      "term": "string",
      "definition_en": "string",
      "definition_si": "string"
    }}
  ],
  "recommendations": ["string", "string"],
  "disclaimer": "string",
  "citations": [
    {{
      "quote": "exact line from report",
      "note": "what the quote supports"
    }}
  ]
}}

Rules:
- Neutral tone. NEVER diagnose or prescribe.
- Always return valid JSON.
"""


async def _analyze_with_gemini(text: str) -> Dict:
    """Analyze text with Gemini and merge responses."""
    chunks = _chunk(text, max_chars=12000)

    partials: List[Dict] = []
    for ch in chunks:
        prompt = _gemini_prompt(ch)
        resp = model.generate_content(prompt)
        data = _extract_json_candidate(resp.text)
        partials.append(data)

    merged = {"meaning": "", "glossary": [], "recommendations": [], "disclaimer": "", "citations": []}

    meaning_parts, seen_terms, seen_reco, seen_quotes = [], set(), set(), set()

    for part in partials:
        if isinstance(part, dict):
            if part.get("meaning"):
                meaning_parts.append(part["meaning"])

            for g in part.get("glossary", []):
                term = (g.get("term") or "").strip().lower()
                if term and term not in seen_terms:
                    merged["glossary"].append(g)
                    seen_terms.add(term)

            for r in part.get("recommendations", []):
                if r and r not in seen_reco:
                    merged["recommendations"].append(r)
                    seen_reco.add(r)

            if part.get("disclaimer") and not merged["disclaimer"]:
                merged["disclaimer"] = part["disclaimer"]

            for c in part.get("citations", []):
                q = (c.get("quote") or "").strip()
                if q and q not in seen_quotes:
                    merged["citations"].append(c)
                    seen_quotes.add(q)

    merged["meaning"] = " ".join(meaning_parts)[:1200].strip()
    if not merged["disclaimer"]:
        merged["disclaimer"] = "This is educational only and not a medical diagnosis. Please consult a healthcare professional."

    return merged


# ---------- Public API ----------
async def process_report(file: UploadFile) -> Dict:
    """Main entry: extract text → Gemini → structured JSON."""
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file upload.")

    name = (file.filename or "").lower()
    if name.endswith(".pdf"):
        text = _extract_text_from_pdf(raw)
    elif name.endswith(".docx"):
        text = _extract_text_from_docx(raw)
    else:
        text = _safe_decode(raw)

    text = _normalize_whitespace(text)
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="Could not extract meaningful text from file.")

    try:
        return await _analyze_with_gemini(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
