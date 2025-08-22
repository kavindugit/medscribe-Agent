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

MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise RuntimeError("GOOGLE_API_KEY is not set in environment variables.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(MODEL)


# ---------- Helpers ----------
def _safe_decode(raw: bytes) -> str:
    if not raw:
        return ""
    detected = chardet.detect(raw)
    enc = detected.get("encoding") or "utf-8"
    try:
        return raw.decode(enc, errors="ignore")
    except Exception:
        return raw.decode("latin-1", errors="ignore")


def _extract_text_from_pdf(raw: bytes) -> str:
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
    s = s.replace("\x00", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def _chunk(text: str, max_chars: int = 12000) -> List[str]:
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
    return f"""
You are the *Member C AI agent*, a professional assistant for analyzing **patient-related documents**.  
Your task is to interpret and explain the content in a structured, patient-friendly way.  

Your output must be **strict JSON** with these fields:
{{
  "meaning": "short, plain summary of the document in patient-friendly terms",
  "glossary": [
    {{
      "term": "technical term",
      "definition_en": "simple English explanation",
      "definition_si": "සිංහල explanation"
    }}
  ],
  "recommendations": [
    "unique, tailored suggestion 1",
    "unique, tailored suggestion 2",
    "..."
  ],
  "disclaimer": "legal/educational disclaimer",
  "citations": [
    {{
      "quote": "exact line from document",
      "note": "what the quote supports"
    }}
  ],
  "is_medical": true | false
}}

### Rules:
- First: decide if this document is **related to a patient** (medical/lab/prescription/clinical/discharge/etc).  
  - If yes → `"is_medical": true` and give full analysis.  
  - If it is completely unrelated to healthcare → `"is_medical": false`, return a simple message in "meaning" and keep other fields empty.  
- If analyzing:  
  - "meaning" = plain summary (2–5 sentences).  
  - "glossary" = bilingual (English + සිංහල).  
  - "recommendations" = 3–5 tailored, **non-repetitive, professional suggestions** relevant to the findings. Highlight what patient should pay attention to.  
  - "disclaimer" = neutral, not a diagnosis.  
  - "citations" = exact quotes from document that support your explanation.  

INPUT DOCUMENT TEXT:
---
{chunk_text}
---

Return valid JSON only. No text outside JSON.
"""


async def _analyze_with_gemini(text: str) -> Dict:
    chunks = _chunk(text, max_chars=12000)
    partials: List[Dict] = []

    for ch in chunks:
        prompt = _gemini_prompt(ch)
        resp = model.generate_content(prompt)
        data = _extract_json_candidate(resp.text)
        partials.append(data)

    merged: Dict = {
        "meaning": "",
        "glossary": [],
        "recommendations": [],
        "disclaimer": "",
        "citations": [],
        "is_medical": True
    }

    meaning_parts: List[str] = []
    seen_terms, seen_reco, seen_quotes = set(), set(), set()

    for part in partials:
        if not isinstance(part, dict):
            continue

        if part.get("is_medical") is False:
            return {
                "meaning": "This document does not appear to be related to a patient or healthcare.",
                "glossary": [],
                "recommendations": [],
                "disclaimer": "This system only analyzes healthcare-related documents.",
                "citations": [],
                "is_medical": False
            }

        if part.get("meaning"):
            meaning_parts.append(part["meaning"])

        for g in part.get("glossary", []) or []:
            term = (g.get("term") or "").strip().lower()
            if term and term not in seen_terms:
                merged["glossary"].append(g)
                seen_terms.add(term)

        for r in part.get("recommendations", []) or []:
            r_norm = (r or "").strip()
            key = re.sub(r"[^a-z0-9 ]", "", r_norm.lower())
            if key and key not in seen_reco:
                if not r_norm.endswith("."):
                    r_norm += "."
                merged["recommendations"].append(r_norm)
                seen_reco.add(key)

        if part.get("disclaimer") and not merged["disclaimer"]:
            merged["disclaimer"] = part["disclaimer"]

        for c in part.get("citations", []) or []:
            q = (c.get("quote") or "").strip()
            if q and q not in seen_quotes:
                merged["citations"].append(c)
                seen_quotes.add(q)

    merged["meaning"] = " ".join(meaning_parts).strip()[:1200]
    if not merged["disclaimer"]:
        merged["disclaimer"] = (
            "This information is educational and not a medical diagnosis. "
            "Always consult a qualified healthcare professional."
        )

    pretty_glossary = []
    for g in merged.get("glossary", []):
        pretty_glossary.append({
            "term": g.get("term"),
            "definitions": {
                "English": g.get("definition_en"),
                "සිංහල": g.get("definition_si"),
            }
        })
    merged["glossary"] = pretty_glossary

    return merged


# ---------- Public API ----------
async def process_report(file: UploadFile) -> Dict:
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
        raise HTTPException(
            status_code=400,
            detail="Could not extract meaningful text from file. Please upload a PDF/DOCX/TXT with text."
        )

    try:
        return await _analyze_with_gemini(text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
