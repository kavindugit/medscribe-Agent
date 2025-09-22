from typing import List, Optional
from app.storage.mongo_client import get_cases_collection

def resolve_case(user_id: str, query: str, case_id: Optional[str] = None) -> List[str]:
    """
    Resolve which case(s) should be used for a chatbot query.
    
    Strategy:
    - If case_id is explicitly provided → use it.
    - If query mentions 'last', 'latest', 'recent' → use last uploaded case.
    - If query mentions 'all', 'history', 'compare' → use all cases for that user.
    - Default → use last uploaded case.
    """

    cases = get_cases_collection()

    # 1️⃣ Explicit case_id wins
    if case_id:
        return [case_id]

    q = query.lower()

    # 2️⃣ Latest case
    if any(word in q for word in ["last", "latest", "recent", "newest"]):
        doc = cases.find_one({"user_id": user_id}, sort=[("uploaded_at", -1)])
        return [doc["_id"]] if doc else []

    # 3️⃣ All cases
    if any(word in q for word in ["all", "history", "compare", "trend", "previous", "past"]):
        return [str(c["_id"]) for c in cases.find({"user_id": user_id})]

    # 4️⃣ Default fallback → latest case
    doc = cases.find_one({"user_id": user_id}, sort=[("uploaded_at", -1)])
    return [doc["_id"]] if doc else []
