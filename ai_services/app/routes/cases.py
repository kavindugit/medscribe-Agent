# app/routes/cases.py
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Header

from app.storage.cases import load_meta, load_raw, load_panels
from app.storage import get_json  # ✅ correct place

router = APIRouter(prefix="/cases", tags=["cases"])

def _require_owner(x_user_id: Optional[str], meta_user_id: str) -> None:
    if meta_user_id and x_user_id and x_user_id != meta_user_id:
        raise HTTPException(status_code=403, detail="Forbidden: case not owned by user")

@router.get("/{case_id}/meta")
def get_meta(case_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    try:
        meta = load_meta(case_id)
        _require_owner(x_user_id, meta.get("user_id", ""))
        return meta
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Case not found")

@router.get("/{case_id}/raw")
def get_raw(case_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    try:
        meta = load_meta(case_id)
        _require_owner(x_user_id, meta.get("user_id", ""))
        text = load_raw(case_id)
        return {"case_id": case_id, "text": text}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Case not found")

@router.get("/{case_id}/data")
def get_data(case_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    try:
        meta = load_meta(case_id)
        _require_owner(x_user_id, meta.get("user_id", ""))
        panels = load_panels(case_id)
        return {"case_id": case_id, "panels": panels}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Case not found")

@router.get("/{case_id}/export")
def export_case(case_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    try:
        meta = load_meta(case_id)
        _require_owner(x_user_id, meta.get("user_id", ""))
        return {
            "meta": meta,
            "raw_text": load_raw(case_id),
            "panels": load_panels(case_id),
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Case not found")

@router.get("/{case_id}/cleaned")
async def get_cleaned(case_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    meta = load_meta(case_id)
    _require_owner(x_user_id, meta.get("user_id", ""))
    data = get_json(case_id, "cleaned.json")
    if data is None:
        raise HTTPException(status_code=404, detail="cleaned.json not found")
    return data
