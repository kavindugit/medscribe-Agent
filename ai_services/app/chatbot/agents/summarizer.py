# app/chatbot/agents/summarizer.py
from typing import Dict, Any
from .base import BaseAgent
from app.chatbot.services.llm_service import LLMService

class SummarizerAgent(BaseAgent):
    """
    Compresses conversation turns or reasoning into a short summary
    for long-term memory storage.
    """

    def __init__(self):
        self.llm = LLMService()

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        history = state.get("history", [])
        reasoning = state.get("reasoning", "")

        # Concatenate recent history + reasoning for context
        text = "\n".join(history[-3:]) + "\n" + reasoning

        prompt = (
            "You are a medical assistant summarizer. "
            "Generate a concise, patient-safe summary of the conversation. "
            "Focus only on medical context, tests, and advice. "
            "Do not invent data.\n\n"
            f"Conversation:\n{text}\n\nSummary:"
        )

        summary = self.llm.ask(prompt)
        state["summary"] = summary.strip()
        return state
