# app/routes/cases.py
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException, Header

from app.storage.mongo_client import get_cases_collection
from app.storage.azure_client import get_sas_url

router = APIRouter(prefix="/cases", tags=["cases"])

# -------------------------
# Ownership helper
# -------------------------
def _require_owner(x_user_id: Optional[str], meta_user_id: str) -> None:
    if meta_user_id and x_user_id and x_user_id != meta_user_id:
        raise HTTPException(status_code=403, detail="Forbidden: case not owned by user")


# -------------------------
# Endpoints
# -------------------------

@router.get("/{case_id}/meta")
def get_meta(case_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    """
    Fetch case metadata from MongoDB.
    """
    cases = get_cases_collection()
    case = cases.find_one({"_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    _require_owner(x_user_id, case.get("user_id", ""))
    return case


@router.get("/{case_id}/file/{file_type}")
async def get_case_file(case_id: str, file_type: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    """
    Return a short-lived SAS URL for case files: raw_text, cleaned, or panels.
    """
    cases = get_cases_collection()
    case = cases.find_one({"_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    _require_owner(x_user_id, case.get("user_id", ""))

    if file_type not in ["raw", "cleaned", "panels"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    key_map = {
        "raw": "raw_text_path",
        "cleaned": "cleaned_path",
        "panels": "panels_path"
    }

    blob_path = case.get(key_map[file_type])
    if not blob_path:
        raise HTTPException(status_code=404, detail=f"{file_type} file not found")

    sas_url = get_sas_url(blob_path, expiry_minutes=5)  # short-lived URL
    return {"sas_url": sas_url}


@router.get("/{case_id}/export")
async def export_case(case_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    """
    Return metadata + SAS URLs for all related files (raw, cleaned, panels).
    """
    cases = get_cases_collection()
    case = cases.find_one({"_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    _require_owner(x_user_id, case.get("user_id", ""))

    response = {
        "meta": case,
        "files": {
            "raw_text": get_sas_url(case["raw_text_path"], expiry_minutes=5),
            "cleaned": get_sas_url(case["cleaned_path"], expiry_minutes=5),
            "panels": get_sas_url(case["panels_path"], expiry_minutes=5),
        },
    }
    return response
