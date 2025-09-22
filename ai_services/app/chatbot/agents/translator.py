# app/chatbot/agents/translator.py
from typing import Dict, Any
from .base import BaseAgent

class TranslatorAgent(BaseAgent):
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        reasoning = state.get("reasoning", "")
        state["simplified"] = f"Patient-friendly explanation:\n{reasoning}"
        return state
