# app/chatbot/routes/chat.py
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.vector.retriever import retrieve_chunks   # ✅ fixed import

router = APIRouter(prefix="/chat", tags=["chatbot"])

# -----------------------------
# Request / Response Models
# -----------------------------
class ChatQuery(BaseModel):
    query: str
    case_id: Optional[str] = None   # restrict search to a case
    top_k: int = 5


class ChatResponse(BaseModel):
    case_id: Optional[str]
    query: str
    results: List[Dict[str, Any]]


# -----------------------------
# Endpoints
# -----------------------------
@router.post("/query")
async def query_chat(
    payload: ChatQuery,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-Id header is required")

    try:
        retrieved = retrieve_chunks(
            query=payload.query,
            case_id=payload.case_id,
            user_id=x_user_id,
            top_k=payload.top_k
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retriever error: {str(e)}")

    return {
        "query": payload.query,
        "meta": retrieved["meta"],      # ✅ report metadata once
        "results": retrieved["results"] # ✅ only chunks + scores
    }