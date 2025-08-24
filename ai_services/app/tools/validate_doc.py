from __future__ import annotations
import re
from dataclasses import dataclass
from typing import List

# --- Tunables --------------------------------------------------------------

KEYWORDS = [
    # panels / sections
    "lipid profile", "complete blood count", "cbc", "liver function test", "lft",
    "renal profile", "kft", "thyroid profile", "tft", "urinalysis", "hematology",
    "biochemistry", "serology",

    # common analytes
    "cholesterol", "ldl", "hdl", "triglyceride", "vldl",
    "glucose", "fasting plasma glucose", "fpg", "hba1c",
    "wbc", "white blood cell", "rbc", "hemoglobin", "hematocrit", "platelet",
    "neutrophils", "lymphocytes", "monocytes", "eosinophils",
    "alt", "ast", "sgpt", "sgot", "bilirubin", "creatinine", "urea", "egfr",
]

UNITS = [
    r"mg\/dL", r"mmol\/L", r"g\/dL", r"IU\/L", r"U\/L", r"mEq\/L",
    r"x10\^3\/u?L", r"x10\^6\/u?L", r"µmol\/L", r"umol\/L", r"ng\/mL", r"pg\/mL",
    r"%",  # for HbA1c and differential counts
]

PANEL_HEADERS = [
    "lipid profile", "complete blood count", "cbc",
    "liver function test", "renal function test", "kidney function test",
    "thyroid function test", "urinalysis", "hematology", "biochemistry",
]

BLACKLIST = [
    # obvious non-medical cues seen in your test PDF
    "assignment", "week", "viva", "total 100", "report template", "presentation",
    "github", "mid evaluation",
]

# detection regexes
REF_RANGE = re.compile(r"\(\s*<?\s*\d+(?:\.\d+)?\s*[-–—]\s*\d+(?:\.\d+)?\s*\)")
UNIT_RX = re.compile("|".join(UNITS), flags=re.I)

# thresholds to tune
MIN_HITS = 2          # minimum total positive signals to accept
MIN_KEYWORD_HITS = 1  # require at least one analytic/panel keyword


# --- Result type -----------------------------------------------------------

@dataclass
class ValidationResult:
    is_medical: bool
    reasons: List[str]
    hits: int
    keyword_hits: int
    unit_hits: int
    range_hits: int
    panel_hits: int
    blacklist_hits: int


# --- Core function ---------------------------------------------------------

def is_medical_report(text: str) -> ValidationResult:
    lower = text.lower()

    # Count signals
    keyword_hits = sum(1 for k in KEYWORDS if k in lower)
    unit_hits = len(UNIT_RX.findall(lower))
    range_hits = len(REF_RANGE.findall(lower))
    panel_hits = sum(1 for p in PANEL_HEADERS if p in lower)
    blacklist_hits = sum(1 for b in BLACKLIST if b in lower)

    # Aggregate score
    hits = keyword_hits + unit_hits + range_hits + panel_hits

    reasons: List[str] = []
    if keyword_hits: reasons.append(f"{keyword_hits} keyword hit(s)")
    if unit_hits:     reasons.append(f"{unit_hits} unit pattern(s)")
    if range_hits:    reasons.append(f"{range_hits} reference range(s)")
    if panel_hits:    reasons.append(f"{panel_hits} panel header(s)")
    if blacklist_hits: reasons.append(f"{blacklist_hits} blacklist cue(s)")

    # Decision rule:
    #  - must have at least MIN_KEYWORD_HITS keyword
    #  - overall hits >= MIN_HITS
    #  - and not dominated by blacklist (very heuristic; you can tighten)
    is_medical = (
        keyword_hits >= MIN_KEYWORD_HITS
        and hits >= MIN_HITS
        and blacklist_hits < hits  # if blacklist overwhelms, reject
    )

    return ValidationResult(
        is_medical=is_medical,
        reasons=reasons if reasons else ["no signals found"],
        hits=hits,
        keyword_hits=keyword_hits,
        unit_hits=unit_hits,
        range_hits=range_hits,
        panel_hits=panel_hits,
        blacklist_hits=blacklist_hits,
    )
