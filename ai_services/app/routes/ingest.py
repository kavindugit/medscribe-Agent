# app/routes/ingest.py
from __future__ import annotations
from fastapi import APIRouter, UploadFile, HTTPException, Header, BackgroundTasks

from app.orchestrator.graph import run_pipeline
from app.models.io import ProcessResponse, IngestStats
from app.vector.indexer import index_case   # ✅ corrected

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

    # 🚀 Pipeline handles: ingest → validate → normalize → save → Azure Blob → Mongo
    state = await run_pipeline(binary, file.content_type, user_id=x_user_id)

    # 🧩 Schedule background indexing into Qdrant
    background_tasks.add_task(index_case, state["case_id"])

    return ProcessResponse(
        case_id=state["case_id"],
        panels=state["panels"],
        ingest_stats=IngestStats(pages=state["pages"], ocr_used=state["ocr_used"]),
        message="Processed, saved to Azure+Mongo, indexing scheduled in Qdrant.",
    )
