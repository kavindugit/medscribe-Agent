import os
import re
import json
import tempfile
from typing import Dict, List

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import UploadFile, HTTPException
import chardet
from PyPDF2 import PdfReader
import docx

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


def _gemini_translation_prompt(text: str, target_lang: str) -> str:
    return f"""
You are a Medical Translation AI.

Translate **only the medical test names** into {target_lang}, but **keep all numeric values, units, and flags intact**. 
Do NOT translate patient info, hospital names, doctor names, or dates.

Output must be valid JSON in this format:
{{
  "translations": [
    {{"original": "FASTING PLASMA GLUCOSE (FBS) 72.4 mg/dL", "translated": "UPශ්රිත රුධිර ග්ලූකෝස් (FBS) 72.4 mg/dL"}}
  ]
}}

Here is the medical report (line by line):

---
{text}
---
"""



async def translate_text(text: str, target_lang: str = "සිංහල") -> Dict:
    prompt = _gemini_translation_prompt(text, target_lang)
    resp = model.generate_content(prompt)

    try:
        # parse Gemini JSON
        data = json.loads(resp.text.strip().replace("```json", "").replace("```", "").strip())
        lines: List[str] = [
            f"{item['original']}\n{item['translated']}"
            for item in data.get("translations", [])
        ]
        return {"translations": lines}
    except Exception:
        # fallback if Gemini doesn’t return clean JSON
        return {"translations": [resp.text.strip()]}


# ---------- Public API ----------
async def process_translation(file: UploadFile, target_lang: str = "සිංහල") -> Dict:
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
    if len(text) < 5:
        raise HTTPException(status_code=400, detail="Could not extract meaningful text from file.")

    try:
        return await translate_text(text, target_lang=target_lang)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
