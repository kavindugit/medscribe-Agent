from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.chatbot.agents.rag_agent import rag_answer   # ✅ moved into agents folder
from app.storage.conversations_mongo import save_conversation

router = APIRouter(prefix="/rag", tags=["chatbot-rag"])

class RAGQuery(BaseModel):
    query: str
    case_id: Optional[str] = None   # ✅ now truly optional
    top_k: int = 5

class RAGResponse(BaseModel):
    query: str
    answer: str
    meta: Dict[str, Any]
    memory_used: Dict[str, Any] = {}   # optional debugging info

@router.post("/chat", response_model=RAGResponse)
async def rag_chat(
    payload: RAGQuery,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-Id header is required")

    try:
        # 🔥 Pass None if case_id isn’t provided → rag_answer uses resolve_case
        answer, memory_used, case_ids = rag_answer(
            user_id=x_user_id,
            query=payload.query,
            case_id=payload.case_id,
            top_k=payload.top_k,
        )

        # Save conversation turn
        save_conversation({
            "_id": str(uuid.uuid4()),
            "user_id": x_user_id,
            "case_ids": case_ids,   # ✅ store which cases were used
            "query": payload.query,
            "answer": answer,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        return {
            "query": payload.query,
            "answer": answer,
            "meta": {"case_ids": case_ids, "user_id": x_user_id},
            "memory_used": memory_used,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG error: {str(e)}")
