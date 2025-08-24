# app/storage/cases.py
from __future__ import annotations
import json, os, time
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.models.domain import Panel  # your existing Pydantic models

ROOT = Path("storage") / "cases"

def _case_dir(case_id: str) -> Path:
    return ROOT / case_id

def ensure_dirs(case_id: str) -> Path:
    d = _case_dir(case_id)
    d.mkdir(parents=True, exist_ok=True)
    return d

def save_case(
    *,
    case_id: str,
    user_id: str,
    mime: str,
    pages: int,
    ocr_used: bool,
    raw_text: str,
    panels: List[Panel],
) -> None:
    d = ensure_dirs(case_id)

    # meta
    meta = {
        "case_id": case_id,
        "user_id": user_id,
        "mime": mime,
        "pages": pages,
        "ocr_used": ocr_used,
        "created_at": int(time.time()),
        "version": 1,
    }
    (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), "utf-8")

    # raw text
    (d / "raw_text.txt").write_text(raw_text or "", "utf-8")

    # panels
    # Panels are Pydantic models — convert to plain dicts
    panels_dict = [p.model_dump() for p in panels]  # Pydantic v2
    (d / "panels.json").write_text(json.dumps(panels_dict, ensure_ascii=False, indent=2), "utf-8")

def load_meta(case_id: str) -> Dict[str, Any]:
    p = _case_dir(case_id) / "meta.json"
    if not p.exists(): raise FileNotFoundError(case_id)
    return json.loads(p.read_text("utf-8"))

def load_raw(case_id: str) -> str:
    p = _case_dir(case_id) / "raw_text.txt"
    if not p.exists(): raise FileNotFoundError(case_id)
    return p.read_text("utf-8")

def load_panels(case_id: str) -> List[Dict[str, Any]]:
    p = _case_dir(case_id) / "panels.json"
    if not p.exists(): raise FileNotFoundError(case_id)
    return json.loads(p.read_text("utf-8"))
