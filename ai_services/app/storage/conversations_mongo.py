from app.storage.mongo_client import get_conversations_collection

def save_conversation(conversation: dict):
    """Insert a new conversation turn into MongoDB"""
    conversations = get_conversations_collection()
    conversations.insert_one(conversation)

def get_conversation_history(user_id: str, case_id: str | None = None, limit: int = 20):
    """Fetch conversation history for a user (and case if provided), newest → oldest"""
    conversations = get_conversations_collection()
    query = {"user_id": user_id}
    if case_id:
        query["case_id"] = case_id
    return list(
        conversations.find(query).sort("timestamp", -1).limit(limit)
    )

def delete_conversation_history(user_id: str, case_id: str | None = None):
    """Delete conversation history for a user (and case if provided)"""
    conversations = get_conversations_collection()
    query = {"user_id": user_id}
    if case_id:
        query["case_id"] = case_id
    conversations.delete_many(query)
