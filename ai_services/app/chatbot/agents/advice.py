# app/chatbot/agents/advice.py
from typing import Dict, Any
from .base import BaseAgent

class AdviceAgent(BaseAgent):
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        simplified = state.get("simplified", "")
        state["response"] = (
            f"{simplified}\n\n💡 General advice: Please follow your doctor’s recommendations."
        )
        return state
