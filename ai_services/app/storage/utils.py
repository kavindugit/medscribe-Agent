# app/storage/utils.py
from pathlib import Path
import json
from typing import Any, Optional

# ai_services/storage/cases/<case_id>/...
CASES_ROOT = (Path(__file__).resolve().parents[2] / "storage" / "cases").resolve()

def _case_dir(case_id: str) -> Path:
    d = CASES_ROOT / case_id
    d.mkdir(parents=True, exist_ok=True)
    return d

def put_json(case_id: str, filename: str, data: Any) -> Path:
    """Write JSON to ai_services/storage/cases/<case_id>/<filename>"""
    p = _case_dir(case_id) / filename
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return p

def get_json(case_id: str, filename: str) -> Optional[dict]:
    """Read JSON from storage; return None if not found"""
    p = CASES_ROOT / case_id / filename
    if not p.exists():
        return None
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)
