from typing import Dict, Any
from .base import BaseAgent

class AdviceAgent(BaseAgent):
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        intent = state.get("intent")

        if intent == "general_health":
            # Keep the LLM-generated answer, don’t overwrite
            return state

        # Default for report-based queries
        simplified = state.get("simplified", "")
        state["response"] = (
            f"{simplified}\n\n💡 General advice: Please follow your doctor’s recommendations."
        )
        return state
