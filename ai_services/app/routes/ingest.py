from fastapi import APIRouter, UploadFile, HTTPException
from app.orchestrator.graph import run_pipeline
from app.models.io import ProcessResponse, IngestStats

ingest_router = APIRouter()

@ingest_router.post("/process", response_model=ProcessResponse)
async def process(file: UploadFile):
    if file.content_type not in {"application/pdf", "image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Please upload a PDF or image")

    binary = await file.read()
    state = await run_pipeline(binary, file.content_type)

    return ProcessResponse(
        case_id=state["case_id"],
        panels=state["panels"],
        ingest_stats=IngestStats(pages=state["pages"], ocr_used=state["ocr_used"]),
        message="Stub pipeline ran. (Next step: OCR + normalize + status)"
    )
