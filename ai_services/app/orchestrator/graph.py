import uuid
from fastapi import HTTPException
from app.models.domain import Panel
from app.orchestrator.state import PipelineState
from app.tools.ingest_pdf import ingest
from app.tools.validate_doc import is_medical_report
from app.tools.clean_normalize import parse_text_to_panels
from app.storage.cases import save_case

async def run_pipeline(file_bytes: bytes, mime: str, user_id: str | None = None) -> PipelineState:
    case_id = str(uuid.uuid4())

    # 1) ingest
    ing = ingest(file_bytes, mime)  # -> {"text","pages","ocr_used"}

    # 2) validate
    v = is_medical_report(ing["text"])
    if not v.is_medical:
        raise HTTPException(status_code=400, detail={
            "message": "This document does not appear to be a medical/lab report.",
            "signals": v.reasons,
        })

    # 3) normalize
    panels: list[Panel] = parse_text_to_panels(ing["text"])

    # 4) persist (user_id may come from Express header; default to "anon")
    save_case(
        case_id=case_id,
        user_id=user_id or "anon",
        mime=mime,
        pages=ing["pages"],
        ocr_used=ing["ocr_used"],
        raw_text=ing["text"],
        panels=panels,
    )

    return {
        "case_id": case_id,
        "panels": panels,
        "pages": ing["pages"],
        "ocr_used": ing["ocr_used"],
    }
