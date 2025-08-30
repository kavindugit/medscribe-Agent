# app/storage/cases.py
from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.models.domain import Panel
from app.storage.azure_client import upload_file   # ✅ Azure uploader

def save_case_cloud(
    *,
    case_id: str,
    user_id: str,
    mime: str,
    pages: int,
    ocr_used: bool,
    raw_text: str,
    panels: List[Panel] | List[Dict[str, Any]],
    report_name: Optional[str] = None,
    hospital: Optional[str] = None,
    doctor: Optional[str] = None,
    uploaded_at_iso: Optional[str] = None,
) -> Dict[str, str]:
    """
    Save a case directly to Azure Blob Storage.
    Returns a dict with blob paths for raw, panels, and meta files.
    """

    uploaded_at = uploaded_at_iso or datetime.now(timezone.utc).isoformat()

    # --- raw.txt ---
    raw_blob = f"cases/{case_id}/raw.txt"
    upload_file(raw_blob, raw_text.encode("utf-8"), content_type="text/plain")

    # --- panels.json ---
    serializable = []
    for p in panels:
        if hasattr(p, "model_dump"):
            serializable.append(p.model_dump())
        else:
            serializable.append(p)

    panels_blob = f"cases/{case_id}/panels.json"
    upload_file(
        panels_blob,
        json.dumps(serializable, indent=2, ensure_ascii=False).encode("utf-8"),
        content_type="application/json",
    )

    # --- meta.json ---
    meta = {
        "case_id": case_id,
        "user_id": user_id,
        "mime": mime,
        "pages": pages,
        "ocr_used": ocr_used,
        "uploaded_at": uploaded_at,
        "report_name": report_name or "Unknown Report",
        "hospital": hospital or "Unknown",
        "doctor": doctor or "Unknown",
    }
    meta_blob = f"cases/{case_id}/meta.json"
    upload_file(
        meta_blob,
        json.dumps(meta, indent=2).encode("utf-8"),
        content_type="application/json",
    )

    return {
        "raw_text_path": raw_blob,
        "panels_path": panels_blob,
        "meta_path": meta_blob,
    }
