# ai_services/app/routes/ingest.py
from __future__ import annotations
from fastapi import APIRouter, UploadFile, HTTPException, Header, BackgroundTasks
from fastapi.responses import JSONResponse
import asyncio

from app.orchestrator.graph import run_pipeline
from app.models.io import ProcessResponse
from app.vector.indexer import index_case
from app.mcp.insight_agent import run_insight_agent_mcp

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
    print(f"📂 Received: {file.filename}, user={x_user_id}")

    # Step 1️⃣ — Run main ingestion pipeline
    state = await run_pipeline(binary, file.content_type, user_id=x_user_id)
    print(f"✅ Pipeline done for case={state['case_id']}")

    # Step 2️⃣ — Background job
    async def background_job():
        try:
            print(f"⚙️ Background started for {state['case_id']} (user={x_user_id})")
            await asyncio.sleep(3)

            await index_case(state["case_id"])
            print(f"📊 Indexed {state['case_id']}")

            result = await run_insight_agent_mcp(state["case_id"], x_user_id)
            print(f"🧠 Insight agent finished → {result.get('status')}")

        except Exception as e:
            print(f"❌ Background job failed: {e}")

    # ✅ Correct way to schedule async function in FastAPI background task
    def run_async_task():
        asyncio.run(background_job())

    background_tasks.add_task(run_async_task)
    print(f"📬 Queued background task for case={state['case_id']}")

    return JSONResponse(
        status_code=200,
        content={
            "case_id": state["case_id"],
            "X-User-Id": x_user_id,
            "message": "✅ Uploaded. Indexing & insight analysis running in background.",
        },
    )
