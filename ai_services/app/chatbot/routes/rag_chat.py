from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

from app.chatbot.rag_agent import rag_answer

router = APIRouter(prefix="/chat-rag", tags=["chatbot"])

class RAGQuery(BaseModel):
    query: str
    case_id: str

@router.post("/ask")
async def ask_rag(payload: RAGQuery, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-Id header is required")

    answer = rag_answer(user_id=x_user_id, query=payload.query, case_id=payload.case_id)
    return {"query": payload.query, "answer": answer}
