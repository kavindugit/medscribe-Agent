# app/tools/clean_normalize.py
# Minimal text -> Panels/Items parser for common lab report rows.

from __future__ import annotations
import re
from typing import Dict, List, Optional
from app.models.domain import Panel, LabItem

# --- helpers ---------------------------------------------------------------

def _to_float(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    s = s.strip().replace(",", "")  # handle "1,234.5"
    try:
        return float(s)
    except ValueError:
        return None

def _normalize_unit(u: Optional[str]) -> Optional[str]:
    if not u:
        return None
    u = u.strip().replace(" / ", "/")
    u = u.replace("mg / dL", "mg/dL").replace("mmol / L", "mmol/L")
    u = u.rstrip(".,;:")  # drop trailing punctuation
    return u

def _looks_like_header(line: str) -> bool:
    # very light heuristics: drop obvious headers/footers
    line = line.strip()
    if not line:
        return True
    header_patterns = [
        r"^Page\s+\d+(\s*/\s*\d+)?$",      # Page 1 / 3
        r"^\d{2}/\d{2}/\d{4}",             # 12/31/2024 ...
        r"^Report\s+Summary$",             # common section
        r"^Glossary of Terms$",            # glossary
        r"^Next Steps",                    # recommendation section
        r"^What This Means for You$",      # explanation block
    ]
    return any(re.search(p, line, flags=re.I) for p in header_patterns)

# --- core parsing ----------------------------------------------------------

# Pattern A: Name  Value  Unit  (low - high)  [optional H/L]
PAT_A = re.compile(
    r"""^\s*
    (?P<name>[A-Za-z][A-Za-z0-9 /().%+\-]+?)      # analyte name
    \s+ (?P<val>[-+]?\d+(?:\.\d+)?)               # numeric value
    \s* (?P<unit>[A-Za-z/%·\.\-]+)?               # optional unit
    \s* (?:\(?\s*(?P<low>[<>]?\s*[-+]?\d+(?:\.\d+)?)\s*[-–—]\s*(?P<high>[-+]?\d+(?:\.\d+)?)\s*\)?)?
    \s* (?P<flag>\b[HL]\b)? \s* $
    """,
    re.X | re.I,
)

# Pattern B: Name  Value  (low - high)  Unit
PAT_B = re.compile(
    r"""^\s*
    (?P<name>[A-Za-z][A-Za-z0-9 /().%+\-]+?)\s+
    (?P<val>[-+]?\d+(?:\.\d+)?)\s*
    \(\s*(?P<low>[<>]?\s*[-+]?\d+(?:\.\d+)?)\s*[-–—]\s*(?P<high>[-+]?\d+(?:\.\d+)?)\s*\)\s*
    (?P<unit>[A-Za-z/%·\.\-]+)\s*
    (?P<flag>\b[HL]\b)? \s*$
    """,
    re.X | re.I,
)

def _panel_for_name(name: str) -> str:
    n = name.lower()
    lipid_keys = ["ldl", "hdl", "triglycer", "cholesterol", "vldl", "chol/hdl", "ldl/hdl"]
    cbc_keys   = ["wbc", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "platelet", "rbc", "hemoglobin", "hematocrit"]
    for k in lipid_keys:
        if k in n:
            return "Serum Lipid Profile"
    for k in cbc_keys:
        if k in n:
            return "Complete Blood Count (CBC)"
    return "General"

def _clean_name(name: str) -> str:
    name = re.sub(r"\s+", " ", name).strip()
    # keep common acronyms as is
    keep = {"LDL","HDL","RBC","WBC","VLDL","CBC"}
    tokens = [t if t.upper() in keep else t.capitalize() for t in name.split(" ")]
    return " ".join(tokens)

def parse_text_to_panels(text: str) -> List[Panel]:
    panels_map: Dict[str, List[LabItem]] = {}

    # 1) basic line cleanup
    lines = [ln for ln in text.splitlines() if not _looks_like_header(ln)]

    # 2) join wrapped rows: if a line ends with the name and next starts with a number → join
    joined: List[str] = []
    i = 0
    while i < len(lines):
        cur = lines[i].strip()
        if i + 1 < len(lines) and re.match(r"^\s*[-+]?\d+(\.\d+)?", lines[i + 1]):
            cur = cur + " " + lines[i + 1].strip()
            i += 1
        joined.append(cur)
        i += 1

    # 3) try to match each row
    for line in joined:
        if not line or len(line) < 3:
            continue

        m = PAT_A.match(line) or PAT_B.match(line)
        if not m:
            continue

        name  = _clean_name(m.group("name"))
        val   = _to_float(m.group("val"))
        unit  = _normalize_unit(m.group("unit"))
        low   = _to_float(m.group("low"))
        high  = _to_float(m.group("high"))
        flag  = (m.group("flag") or "").strip().upper() or None

        if val is None:
            continue

        ref_text = None
        if low is not None and high is not None:
            if low > high:  # swap if reversed
                low, high = high, low
            ref_text = f"{low} - {high}"

        item = LabItem(
            name=name,
            result=val,
            unit=unit,
            ref_text=ref_text,
            ref_low=low,
            ref_high=high,
            flag=flag or None,
            status="Normal",                    # your teammate will overwrite later
            status_reason="Not evaluated here", # explicit note
        )

        panel_title = _panel_for_name(name)
        panels_map.setdefault(panel_title, []).append(item)

    # 4) build Panel list
    panels: List[Panel] = []
    for title, items in panels_map.items():
        if items:
            panels.append(Panel(title=title, items=items))

    return panels
