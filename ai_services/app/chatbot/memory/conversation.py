# app/chatbot/memory/conversation.py
from typing import Dict, Any, List
from app.storage.mongo_client import get_conversations_collection
from .base import BaseMemory
from datetime import datetime, timezone
import uuid

class ConversationMemory(BaseMemory):
    def load(self, user_id: str, case_id: str | None = None, limit: int = 5) -> List[Dict[str, Any]]:
        conversations = get_conversations_collection()
        query = {"user_id": user_id}
        if case_id:
            query["case_id"] = case_id
        return list(conversations.find(query).sort("timestamp", -1).limit(limit))

    def save(self, user_id: str, case_id: str, query: str, answer: str) -> None:
        conversations = get_conversations_collection()
        conversations.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "case_id": case_id,
            "query": query,
            "answer": answer,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
