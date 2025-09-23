from fastapi import APIRouter, Header, HTTPException
from app.storage.conversations_mongo import get_conversation_history, clear_conversation_history

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("/")
async def get_history(x_user_id: str = Header(..., alias="X-User-Id")):
    history = get_conversation_history(x_user_id)
    return {"success": True, "history": history}

@router.delete("/")
async def clear_history(x_user_id: str = Header(..., alias="X-User-Id")):
    clear_conversation_history(x_user_id)
    return {"success": True, "message": "Conversation history cleared"}
