from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from app.agents.summarizer.summarizer import summarize_report
from app.agents.classifier.classifier import classify_report
from app.agents.explainer.plain_language_agent import process_medical_report
from app.agents.translator.translator_agent import translate_report

router = APIRouter(prefix="/pipeline", tags=["pipeline"])

# Request body schema
class PipelineRequest(BaseModel):
    medical_report: str

@router.post("/run")
async def run_pipeline(payload: PipelineRequest):
    medical_report = payload.medical_report

    async def event_stream():
        # 1️⃣ Summarizer
        summary, sources, tools = summarize_report(medical_report)
        yield f"data: {json.dumps({'agent': 'summarizer', 'output': summary})}\n\n"

        # 2️⃣ Classifier
        classification = classify_report(medical_report)
        yield f"data: {json.dumps({'agent': 'classifier', 'output': classification.dict()})}\n\n"

        # 3️⃣ Explainer
        explanation, sources, tools = process_medical_report(medical_report)
        yield f"data: {json.dumps({'agent': 'explainer', 'output': explanation})}\n\n"

        # 4️⃣ Translator
        translation, sources, tools = translate_report(medical_report)
        yield f"data: {json.dumps({'agent': 'translator', 'output': translation})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
