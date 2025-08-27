# app/tools/report_classifier.py
from __future__ import annotations
import os, re
from typing import Optional, Tuple

# ---------------------------
# Deterministic patterns
# ---------------------------
_REPORT_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b(cbc|complete\s+blood\s+count)\b", re.I), "Complete Blood Count"),
    (re.compile(r"\b(lipid\s+profile|cholesterol\s+profile)\b", re.I), "Lipid Profile"),
    (re.compile(r"\b(lft|liver\s+function\s+test[s]?)\b", re.I), "Liver Function Test"),
    (re.compile(r"\b(rft|renal\s+function\s+test[s]?|kidney\s+function)\b", re.I), "Renal Function Test"),
    (re.compile(r"\b(fbc|full\s+blood\s+count)\b", re.I), "Full Blood Count"),
    (re.compile(r"\b(ft[34]|thyroid\s+function|tsh|t3|t4)\b", re.I), "Thyroid Function Test"),
    (re.compile(r"\b(urinalysis|urine\s+examin(ation|e))\b", re.I), "Urinalysis"),
    (re.compile(r"\b(hba1c|glycated\s+hemoglobin)\b", re.I), "HbA1c"),
    (re.compile(r"\b(x[- ]?ray|radiograph|chest\s+x[- ]?ray)\b", re.I), "X-ray"),
    (re.compile(r"\b(ct[- ]?(scan)?|computed\s+tomography)\b", re.I), "CT Scan"),
    (re.compile(r"\b(mri|magnetic\s+resonance)\b", re.I), "MRI"),
    (re.compile(r"\b(ultrasound|sonography|usg)\b", re.I), "Ultrasound"),
    (re.compile(r"\b(echo(cardiogram)?|echocardiography)\b", re.I), "Echocardiogram"),
]

_HOSPITAL_HINTS = re.compile(
    r"\b(Hospital|Medical\s+Center|Clinic|Diagnostic\s+Center|Health\s+Lab|Laboratory|Patholog(?:y|ical)\s+Lab)\b",
    re.I,
)
_DOCTOR_HINTS = re.compile(r"\b(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b")

# ---------------------------
# Header extraction
# ---------------------------
def _first_k_lines(text: str, k: int = 40) -> str:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    return "\n".join(lines[:k])

def _extract_hospital(header: str) -> Optional[str]:
    candidates = []
    for ln in header.splitlines():
        if _HOSPITAL_HINTS.search(ln) and 3 <= len(ln) <= 80:
            clean = re.sub(r"[|•◦·\-–—]+\s*\S+$", "", ln).strip()
            candidates.append(clean)
    return min(candidates, key=len) if candidates else None

def _extract_doctor(header: str) -> Optional[str]:
    m = _DOCTOR_HINTS.search(header)
    return m.group(1) if m else None

# ---------------------------
# Deterministic classifier
# ---------------------------
def classify_by_rules(header: str) -> Optional[str]:
    hay = header.lower()
    for pat, name in _REPORT_PATTERNS:
        if pat.search(hay):
            return name
    if re.search(r"\b(haematology|hematology)\b", hay): return "Haematology Panel"
    if re.search(r"\b(biochemistry)\b", hay): return "Biochemistry Panel"
    if re.search(r"\b(radiology|imaging)\b", hay): return "Radiology Report"
    return None

# ---------------------------
# Gemini fallback (optional)
# ---------------------------
def _safe_header_summary(header: str, max_chars: int = 350) -> str:
    h = header[:max_chars]
    h = re.sub(r"\b\d{6,}\b", "[ID]", h)           # long numeric IDs
    h = re.sub(r"\+?\d[\d\- ]{6,}\d", "[PHONE]", h) # phones
    return h

def classify_by_llm(header: str) -> Optional[str]:
    """
    Use Gemini only if USE_LLM_FALLBACK=true and GOOGLE_API_KEY is set.
    Env:
      USE_LLM_FALLBACK=true
      GOOGLE_API_KEY=...
      LLM_FALLBACK_MODEL=gemini-1.5-flash   (default)
    """
    if os.getenv("USE_LLM_FALLBACK", "false").lower() != "true":
        return None
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    model_name = os.getenv("LLM_FALLBACK_MODEL", "gemini-1.5-flash")

    # Lazy import to avoid hard dependency otherwise
    try:
        import google.generativeai as genai
    except Exception:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        prompt = (
            "You are a strict medical report classifier. "
            "From the snippet below, output ONLY a short report type label "
            '(e.g., "Complete Blood Count", "Liver Function Test", "MRI", "CT Scan", '
            '"Ultrasound", "Radiology Report", "Urinalysis"). '
            "If uncertain, output exactly: Unknown Report.\n\n"
            f"Snippet:\n{_safe_header_summary(header)}"
        )
        resp = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.0,
                "max_output_tokens": 8,
            },
            safety_settings=[],
        )
        text = (resp.text or "").strip()
        text = re.sub(r"[\r\n]+", " ", text)
        if not text or text.lower().startswith("unknown"):
            return None
        if 2 <= len(text) <= 64:
            return text
    except Exception:
        return None

    return None

# ---------------------------
# Public API
# ---------------------------
def infer_report_meta(raw_text: str) -> tuple[str, str, str]:
    header = _first_k_lines(raw_text, k=40)

    report_name = classify_by_rules(header) or ""
    if not report_name:
        report_name = classify_by_llm(header) or ""

    if not report_name:
        title_like = next(
            (ln for ln in header.splitlines()
             if re.search(r"(report|test|profile|examination|imaging)", ln, re.I)),
            ""
        )
        report_name = title_like.strip()[:64] if title_like else "Unknown Report"

    hospital = _extract_hospital(header) or "Unknown"
    doctor = _extract_doctor(header) or "Unknown"

    # normalize spacing
    norm = lambda s: re.sub(r"\s{2,}", " ", s or "").strip()
    return (norm(report_name), norm(hospital), norm(doctor))
