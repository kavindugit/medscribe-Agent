# app/routes/ingest.py
from __future__ import annotations
from fastapi import APIRouter, UploadFile, HTTPException, Header, BackgroundTasks

from app.orchestrator.graph import run_pipeline
from app.models.io import ProcessResponse, IngestStats
from app.embeddings.build_index import build_index_background

router = APIRouter(prefix="/ingest", tags=["process"])

@router.post("/process", response_model=ProcessResponse)
async def process(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    if file.content_type not in {"application/pdf", "image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Please upload a PDF or image")

    binary = await file.read()

    # Your pipeline handles: ingest → validate → normalize → save raw/panels/cleaned.json
    state = await run_pipeline(binary, file.content_type, user_id=x_user_id)

    # 🔔 Immediately schedule embeddings build (HF Inference API) in the background
    background_tasks.add_task(build_index_background, state["case_id"])

    return ProcessResponse(
        case_id=state["case_id"],
        panels=state["panels"],
        ingest_stats=IngestStats(pages=state["pages"], ocr_used=state["ocr_used"]),
        message="Processed and saved. (Index build scheduled)",
    )
