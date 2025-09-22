# app/chatbot/orchestrator/state.py
from typing import TypedDict, List, Dict, Any

class PipelineState(TypedDict, total=False):
    query: str
    case_id: str
    user_id: str
    top_k: int
    docs: List[Dict[str, Any]]
    reasoning: str
    simplified: str
    response: str
    end: bool
