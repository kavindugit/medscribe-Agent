from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.storage.conversations_mongo import get_conversation_history

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("/{case_id}")
def fetch_conversation_history(
    case_id: str,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="X-User-Id header required")

    history = get_conversation_history(x_user_id, case_id)
    return {"case_id": case_id, "user_id": x_user_id, "history": history}
