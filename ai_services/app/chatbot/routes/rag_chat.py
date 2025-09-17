# app/chatbot/routes/rag_chat.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.chatbot.rag_agent import rag_answer
from app.storage.conversations_mongo import save_conversation
from app.storage.cases_mongo import get_latest_case   # ✅ use latest case lookup

router = APIRouter(prefix="/rag", tags=["chatbot-rag"])

class RAGQuery(BaseModel):
    query: str
    case_id: Optional[str] = None   # still optional (but auto-filled if missing)
    top_k: int = 5

class RAGResponse(BaseModel):
    query: str
    answer: str
    meta: Dict[str, Any]

@router.post("/chat", response_model=RAGResponse)
async def rag_chat(
    payload: RAGQuery,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-Id header is required")

    try:
        # ✅ Try RAG with latest report
        answer = rag_answer(
            user_id=x_user_id,
            query=payload.query,
            case_id=payload.case_id,
            top_k=payload.top_k,
        )

        if "⚠️" in answer or "no medical reports" in answer.lower():
            # ⚠️ No reports found → graceful fallback
            answer = (
                "I don’t see any medical reports uploaded for your account yet. "
                "Please upload a report so I can summarize it. "
                "Meanwhile, feel free to ask me general health questions. "
            )

        # Save conversation turn
        save_conversation({
            "_id": str(uuid.uuid4()),
            "user_id": x_user_id,
            "case_id": payload.case_id,
            "query": payload.query,
            "answer": answer,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        return {
            "query": payload.query,
            "answer": answer,
            "meta": {"case_id": payload.case_id, "user_id": x_user_id},
        }

    except Exception as e:
        # 🚨 Catch-all fallback
        return {
            "query": payload.query,
            "answer": (
                "I'm here to help! I couldn't access your reports right now, "
                "but you can still ask me general medical questions."
            ),
            "meta": {"case_id": None, "user_id": x_user_id},
        }
