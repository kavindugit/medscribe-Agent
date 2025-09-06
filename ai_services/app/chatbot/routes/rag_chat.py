from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.chatbot.rag_agent import rag_answer
from app.storage.conversations_mongo import save_conversation

router = APIRouter(prefix="/rag", tags=["chatbot-rag"])

class RAGQuery(BaseModel):
    query: str
    case_id: Optional[str] = None
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
        # 🔥 Call rag_answer directly with all required args
        answer = rag_answer(
            user_id=x_user_id,
            query=payload.query,
            case_id=payload.case_id,
            top_k=payload.top_k,
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
        raise HTTPException(status_code=500, detail=f"RAG error: {str(e)}")
