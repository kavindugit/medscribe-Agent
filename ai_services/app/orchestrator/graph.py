import uuid
import json
from datetime import datetime, timezone
from fastapi import HTTPException

from app.models.domain import Panel
from app.orchestrator.state import PipelineState
from app.tools.ingest_pdf import ingest
from app.tools.validate_doc import is_medical_report
from app.tools.clean_normalize import parse_text_to_panels
from app.tools.report_classifier import infer_report_meta
from app.normalizer import run_normalizer
from app.storage.cases_mongo import save_case_mongo
from app.storage.azure_client import upload_file   # ✅ use Azure uploader
from app.tools.redact_sensitive_data import redact_sensitive_data


async def run_pipeline(file_bytes: bytes, mime: str, user_id: str | None = None) -> PipelineState:
    case_id = str(uuid.uuid4())

    # 1️⃣ Ingest (PDF/image → text)
    ing = ingest(file_bytes, mime)  # -> {"text","pages","ocr_used"}

    # 2️⃣ Validate it's a medical/lab report
    v = is_medical_report(ing["text"])
    if not v.is_medical:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "This document does not appear to be a medical/lab report.",
                "signals": v.reasons,
            },
        )

    # 3️⃣ Normalize → structured clean text
    cleaned_payload = run_normalizer(ing["text"], {"mime": mime})

    # 🧼 Sanitize sensitive info before upload
    sanitized_text = redact_sensitive_data(cleaned_payload.cleaned_text)
    sanitized_sections = {
        k: redact_sensitive_data(v) for k, v in cleaned_payload.sections.items()
    }

    # Replace cleaned payload content safely
    cleaned_payload = cleaned_payload.copy(
        update={"cleaned_text": sanitized_text, "sections": sanitized_sections}
    )

    # 4️⃣ Parse into structured panels (safe, does not need PII)
    panels: list[Panel] = parse_text_to_panels(ing["text"])

    lab_lines = []
    for panel in panels:
        for item in panel.items:
            ref = f" (ref {item.ref_text})" if item.ref_text else ""
            flag = f" [{item.flag}]" if item.flag else ""
            lab_lines.append(f"- {item.name}: {item.result} {item.unit or ''}{ref}{flag}")

    if lab_lines:
        sections = cleaned_payload.sections.copy()
        sections["tests"] = "\n".join(lab_lines)
        cleaned_payload = cleaned_payload.copy(update={"sections": sections, "version": 2})

    # 5️⃣ Upload redacted versions to Azure Blob
    raw_path = f"cases/{case_id}/raw.txt"
    upload_file(raw_path, redact_sensitive_data(ing["text"]).encode("utf-8"), content_type="text/plain")

    cleaned_path = f"cases/{case_id}/cleaned.json"
    cleaned_bytes = cleaned_payload.model_dump_json(indent=2).encode("utf-8")
    upload_file(cleaned_path, cleaned_bytes, content_type="application/json")

    panels_path = f"cases/{case_id}/panels.json"
    panels_bytes = json.dumps([p.model_dump() for p in panels], indent=2).encode("utf-8")
    upload_file(panels_path, panels_bytes, content_type="application/json")

    # 6️⃣ Infer metadata (redact before saving)
    report_name, hospital, doctor = infer_report_meta(ing["text"])
    hospital = "[REDACTED]"
    doctor = "[REDACTED]"

    # 7️⃣ Save metadata to MongoDB
    save_case_mongo({
        "_id": case_id,
        "user_id": user_id or "anon",
        "report_name": report_name,
        "hospital": hospital,
        "doctor": doctor,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "raw_text_path": raw_path,
        "cleaned_path": cleaned_path,
        "panels_path": panels_path,
    })

    # 8️⃣ Return safe pipeline state
    return {
        "case_id": case_id,
        "panels": panels,
        "pages": ing["pages"],
        "ocr_used": ing["ocr_used"],
        "report_name": report_name,
        "hospital": hospital,
        "doctor": doctor,
    }
