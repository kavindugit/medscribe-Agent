# app/routes/cases.py
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from app.storage.azure_client import container_client

from app.storage.mongo_client import get_cases_collection
from app.storage.azure_client import get_sas_url
from fastapi.responses import StreamingResponse
router = APIRouter(prefix="/cases", tags=["cases"])



from fastapi import HTTPException
from typing import Optional

def _require_owner(x_user_id: Optional[str], meta_user_id: str) -> None:
    if meta_user_id and x_user_id and str(x_user_id) != str(meta_user_id):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Forbidden: case not owned by user",
                "x_user_id": str(x_user_id),
                "meta_user_id": str(meta_user_id),
            },
        )


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
    Return a SAS URL for case files: raw_text, cleaned, or panels.
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

    sas_url = get_sas_url(blob_path)  # ✅ no expiry_minutes
    return {"sas_url": sas_url,
            "blob_path": blob_path
            }


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
            "raw_text": get_sas_url(case["raw_text_path"]),
            "cleaned": get_sas_url(case["cleaned_path"]),
            "panels": get_sas_url(case["panels_path"]),
        },
    }
    return response


@router.get("/{case_id}/file/{file_type}/stream")
async def stream_case_file(case_id: str, file_type: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    case = get_cases_collection().find_one({"_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    _require_owner(x_user_id, case.get("user_id", ""))

    key_map = {
        "raw": "raw_text_path",
        "cleaned": "cleaned_path",
        "panels": "panels_path"
    }

    blob_path = case.get(key_map[file_type])
    if not blob_path:
        raise HTTPException(status_code=404, detail=f"{file_type} file not found")

    blob_client = container_client.get_blob_client(blob_path)
    stream = blob_client.download_blob().chunks()  # generator
    
    return StreamingResponse(stream, media_type="application/json") 
