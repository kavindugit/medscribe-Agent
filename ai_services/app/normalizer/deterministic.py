#app/normalizer/deterministic.py

import re
from collections import Counter
from typing import Dict, Tuple

from .schemas import CleanedPayload, CleanedSignals


# --------------------------
# Primitive transforms
# --------------------------

def normalize_whitespace(text: str) -> str:
    """Normalize line endings, collapse spaces, trim trailing spaces."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return text.strip()


def remove_watermarks(text: str) -> Tuple[str, int, bool]:
    """Drop common watermark/boilerplate lines."""
    wm_patterns = [
        r"\bconfidential\b",
        r"\bdo not copy\b",
        r"\bscanned by\b",
        r"\bfax(ed)?\b",
        r"powered by [\w\- ]+",
    ]
    rx = [re.compile(p, re.I) for p in wm_patterns]

    removed = 0
    found = False
    kept = []
    for line in text.splitlines():
        low = line.lower()
        if any(r.search(low) for r in rx):
            removed += 1
            found = True
            continue
        kept.append(line)

    return "\n".join(kept), removed, found


def strip_headers_footers(text: str) -> Tuple[str, Dict[str, bool], int]:
    """
    Remove (a) page-number looking lines and (b) short lines that repeat >= 3 times
    across the document (typical headers/footers).
    """
    page_num_re = re.compile(r"^(?:page\s*)?\d+(?:\s*/\s*\d+)?$", re.I)

    lines = text.splitlines()
    freq = Counter(l.strip() for l in lines if l.strip())

    kept = []
    removed = 0
    removed_page_numbers = False

    for line in lines:
        s = line.strip()
        if s and page_num_re.match(s):
            removed += 1
            removed_page_numbers = True
            continue
        # treat short, highly repeated lines as headers/footers
        if s and len(s) <= 80 and freq[s] >= 3:
            removed += 1
            continue
        kept.append(line)

    return "\n".join(kept), {"page_numbers_removed": removed_page_numbers}, removed


def normalize_units_tokens(text: str) -> str:
    """ASCII-ize common glyphs and unify simple unit spellings (no conversions)."""
    t = text
    # ASCII punctuation
    t = t.replace("–", "-").replace("—", "-").replace("·", ".")
    t = t.replace("•", "-").replace("‑", "-")
    # unify slashes with spaces around
    t = re.sub(r"\s*/\s*", "/", t)
    # canonicalize a few units
    t = re.sub(r"\bmg\s*/\s*dL\b", "mg/dL", t, flags=re.I)
    t = re.sub(r"\bmmol\s*/\s*L\b", "mmol/L", t, flags=re.I)
    t = re.sub(r"\bg/L\b", "g/L", t)
    return t


# --------------------------
# Sectionization (heuristic)
# --------------------------

HEADINGS = {
    "patient_info": [r"^patient\b", r"^patient info\b", r"^demographics\b"],
    "labs_block": [
        r"^cbc\b", r"^complete blood count\b",
        r"^lipid profile\b", r"^serum lipid profile\b",
        r"^liver function\b", r"^renal function\b", r"^thyroid\b",
    ],
    "impression": [r"^impression\b", r"^summary\b", r"^comment(s)?\b", r"^note\b"],
    "header": [r"^outpatient encounter note\b", r"^clinic\b", r"^hospital\b"],
    "footer": [r"^physician\b", r"^doctor\b", r"^signature\b", r"^reported by\b"],
}


def detect_sections(text: str) -> Dict[str, str]:
    """
    Find rough sections by heading lines. If none found, return minimal dict.
    """
    lines = text.splitlines()
    indices = {}
    for i, ln in enumerate(lines):
        low = ln.strip().lower()
        for key, patterns in HEADINGS.items():
            if any(re.match(p, low) for p in patterns):
                indices.setdefault(key, i)

    # slice blocks (very heuristic)
    sections: Dict[str, str] = {}
    if not indices:
        sections["clean_body"] = text
        return sections

    def block(start_key: str, end_key_candidates: list[str]) -> str:
        if start_key not in indices:
            return ""
        start = indices[start_key]
        # find earliest end after start
        ends = [indices[k] for k in end_key_candidates if k in indices and indices[k] > start]
        end = min(ends) if ends else len(lines)
        return "\n".join(lines[start:end]).strip()

    sections["header"] = block("header", ["patient_info", "labs_block", "impression", "footer"])
    sections["patient_info"] = block("patient_info", ["labs_block", "impression", "footer"])
    sections["labs_block"] = block("labs_block", ["impression", "footer"])
    sections["impression"] = block("impression", ["footer"])
    sections["footer"] = block("footer", [])

    # prune empties
    sections = {k: v for k, v in sections.items() if v}
    return sections


# --------------------------
# Orchestrator entry
# --------------------------

def run_normalizer(raw_text: str, meta: dict | None = None) -> CleanedPayload:
    """
    Deterministic normalizer:
      - whitespace & punctuation normalization
      - watermark/header/footer removal
      - unit token normalization
      - heuristic sectionization
    """
    t = normalize_whitespace(raw_text)

    t, wm_removed_count, wm_found = remove_watermarks(t)
    t, page_sig, rep_removed = strip_headers_footers(t)
    t = normalize_units_tokens(t)

    sections = detect_sections(t)

    signals = CleanedSignals(
        page_numbers_removed=page_sig.get("page_numbers_removed", False),
        watermark_removed=wm_found,
        lines_dropped=wm_removed_count + rep_removed,
        ocr_needed=(len(t) < 60),
    )

    return CleanedPayload(
        cleaned_text=t,
        sections=sections,
        signals=signals,
        version=1,
    )
