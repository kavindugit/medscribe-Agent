# app/orchestrator/graph.py
import uuid
from fastapi import HTTPException

from app.models.domain import Panel
from app.orchestrator.state import PipelineState
from app.tools.ingest_pdf import ingest
from app.tools.validate_doc import is_medical_report
from app.tools.clean_normalize import parse_text_to_panels
from app.storage.cases import save_case
from app.normalizer import run_normalizer  # ✅ fix typo: was run_noramlizer
from app.storage import put_json            # ✅ writes storage/cases/<id>/cleaned.json


async def run_pipeline(file_bytes: bytes, mime: str, user_id: str | None = None) -> PipelineState:
    case_id = str(uuid.uuid4())

    # 1) Ingest (PDF/image → text)
    ing = ingest(file_bytes, mime)  # -> {"text","pages","ocr_used"}

    # 2) Validate it's a medical/lab report
    v = is_medical_report(ing["text"])
    if not v.is_medical:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "This document does not appear to be a medical/lab report.",
                "signals": v.reasons,
            },
        )

    # 3) Deterministic normalization (faithful cleanup; no LLM)
    cleaned_payload = run_normalizer(ing["text"], {"mime": mime})
    # persist cleaned.json for RAG/teammates
    put_json(case_id, "cleaned.json", cleaned_payload.model_dump())

    # 4) Lightweight parsing to panels (your existing heuristic)
    panels: list[Panel] = parse_text_to_panels(ing["text"])

    # 5) Persist core artifacts (meta, raw_text, panels)
    save_case(
        case_id=case_id,
        user_id=user_id or "anon",
        mime=mime,
        pages=ing["pages"],
        ocr_used=ing["ocr_used"],
        raw_text=ing["text"],
        panels=panels,
    )

    # 6) Return minimal state to caller (UI can fetch /cases/{id}/cleaned later)
    return {
        "case_id": case_id,
        "panels": panels,
        "pages": ing["pages"],
        "ocr_used": ing["ocr_used"],
    }
