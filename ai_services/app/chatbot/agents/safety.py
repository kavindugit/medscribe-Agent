# app/chatbot/agents/safety.py
from typing import Dict, Any
from .base import BaseAgent

class SafetyGuardAgent(BaseAgent):
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        query = state.get("query", "").lower()
        if "chest pain" in query or "can't breathe" in query:
            state["response"] = (
                "🚨 This may be a medical emergency. Please seek urgent care immediately."
            )
            state["end"] = True
        return state
