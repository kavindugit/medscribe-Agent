# app/storage/cases.py
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, List, Dict

from app.models.domain import Panel  # if you store panels as Pydantic objects

ROOT = Path("storage") / "cases"

def _case_dir(case_id: str) -> Path:
    return ROOT / case_id

def _ensure_case_dir(case_id: str) -> Path:
    d = _case_dir(case_id)
    d.mkdir(parents=True, exist_ok=True)
    return d

# ---------- JSON helpers (used by routes and graph) ----------

def put_json(case_id: str, filename: str, data: Any) -> None:
    d = _ensure_case_dir(case_id)
    p = d / filename
    # Ensure Pydantic models become plain dicts
    if hasattr(data, "model_dump"):
        data = data.model_dump()
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_json(case_id: str, filename: str) -> Any | None:
    p = _case_dir(case_id) / filename
    if not p.exists():
        return None
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)

# ---------- High-level save/load helpers ----------

def save_case(
    *,
    case_id: str,
    user_id: str,
    mime: str,
    pages: int,
    ocr_used: bool,
    raw_text: str,
    panels: List[Panel] | List[Dict[str, Any]],
) -> None:
    d = _ensure_case_dir(case_id)

    # meta
    meta = {
        "case_id": case_id,
        "user_id": user_id,
        "mime": mime,
        "pages": pages,
        "ocr_used": ocr_used,
    }
    (d / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    # raw text
    (d / "raw.txt").write_text(raw_text or "", encoding="utf-8")

    # panels (convert pydantic to dicts if needed)
    serializable = []
    for p in panels:
        if hasattr(p, "model_dump"):
            serializable.append(p.model_dump())
        else:
            serializable.append(p)
    (d / "panels.json").write_text(json.dumps(serializable, indent=2, ensure_ascii=False), encoding="utf-8")

def load_meta(case_id: str) -> Dict[str, Any]:
    p = _case_dir(case_id) / "meta.json"
    return json.loads(p.read_text(encoding="utf-8"))

def load_raw(case_id: str) -> str:
    p = _case_dir(case_id) / "raw.txt"
    return p.read_text(encoding="utf-8")

def load_panels(case_id: str) -> Any:
    p = _case_dir(case_id) / "panels.json"
    return json.loads(p.read_text(encoding="utf-8"))
