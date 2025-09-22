from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.chatbot.agents.rag_agent import rag_answer
from app.chatbot.utils.intent_classifier import classify_intent
from app.storage.conversations_mongo import save_conversation
from app.storage.mongo_client import get_cases_collection

router = APIRouter(prefix="/rag", tags=["chatbot-rag"])

# -----------------------------
# Request / Response Models
# -----------------------------
class RAGQuery(BaseModel):
    query: str
    case_id: Optional[str] = None
    top_k: int = 5

class RAGResponse(BaseModel):
    query: str
    answer: str
    meta: Dict[str, Any]
    memory_used: Dict[str, Any] = {}

# -----------------------------
# Endpoint
# -----------------------------
@router.post("/chat", response_model=RAGResponse)
async def rag_chat(
    payload: RAGQuery,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-Id header is required")

    query = payload.query.strip()
    intent = classify_intent(query)

    # -----------------------------
    # Special Case: LIST_REPORTS
    # -----------------------------
    if intent == "LIST_REPORTS":
        cases = get_cases_collection()
        user_cases = list(
            cases.find({"user_id": x_user_id}).sort("uploaded_at", -1)
        )

        if not user_cases:
            return {
                "query": payload.query,
                "answer": "📂 You don’t have any uploaded reports yet.",
                "meta": {"case_ids": [], "user_id": x_user_id},
                "memory_used": {},
            }

        answer_lines = ["📑 You have the following reports:"]
        case_ids = []
        for i, c in enumerate(user_cases, start=1):
            case_ids.append(c["_id"])
            answer_lines.append(
                f"{i}. {c.get('report_name','Unknown Report')} "
                f"(uploaded {c.get('uploaded_at','Unknown Date')})"
            )

        return {
            "query": payload.query,
            "answer": "\n".join(answer_lines),
            "meta": {"case_ids": case_ids, "user_id": x_user_id},
            "memory_used": {},
        }

    # -----------------------------
    # Default: REPORT_QUESTION or GENERAL_HEALTH → use RAG
    # -----------------------------
    try:
        answer, memory_used, case_ids = rag_answer(
            user_id=x_user_id,
            query=query,
            case_id=payload.case_id,
            top_k=payload.top_k,
        )

        # Save conversation turn
        save_conversation({
            "_id": str(uuid.uuid4()),
            "user_id": x_user_id,
            "case_ids": case_ids,
            "query": query,
            "answer": answer,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        return {
            "query": query,
            "answer": answer,
            "meta": {"case_ids": case_ids, "user_id": x_user_id},
            "memory_used": memory_used,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG error: {str(e)}")
