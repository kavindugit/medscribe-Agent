import uuid
from fastapi import HTTPException
from app.models.domain import Panel
from app.orchestrator.state import PipelineState
from app.tools.ingest_pdf import ingest
from app.tools.validate_doc import is_medical_report
from app.tools.clean_normalize import parse_text_to_panels

async def run_pipeline(file_bytes: bytes, mime: str) -> PipelineState:
    case_id = str(uuid.uuid4())

    # 1) Ingest
    ing = ingest(file_bytes, mime)  # {text, pages, ocr_used}

    # 2) Validate document type (reject early if non-medical)
    v = is_medical_report(ing["text"])
    if not v.is_medical:
        # Raise an HTTPException so /process returns 400 with a clear message
        detail = {
            "message": "This document does not appear to be a medical/lab report.",
            "signals": v.reasons,
        }
        raise HTTPException(status_code=400, detail=detail)

    # 3) Normalize (only if valid)
    panels: list[Panel] = parse_text_to_panels(ing["text"])

    return {
        "case_id": case_id,
        "panels": panels,
        "pages": ing["pages"],
        "ocr_used": ing["ocr_used"],
    }
