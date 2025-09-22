# app/chatbot/agents/retriever.py
from typing import Dict, Any
from .base import BaseAgent
from app.vector.retriever import retrieve_chunks

class QdrantRetrieverAgent(BaseAgent):
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        query = state["query"]
        user_id = state.get("user_id")
        case_id = state.get("case_id")
        top_k = state.get("top_k", 5)

        retrieved = retrieve_chunks(query=query, case_id=case_id, user_id=user_id, top_k=top_k)
        state["docs"] = retrieved.get("results", [])
        return state
