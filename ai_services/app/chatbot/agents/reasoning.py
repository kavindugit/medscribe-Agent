# app/chatbot/agents/reasoning.py
from typing import Dict, Any
from .base import BaseAgent
from app.chatbot.services.llm_service import LLMService

class ReasoningAgent(BaseAgent):
    def __init__(self):
        self.llm = LLMService()

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        query = state["query"]

        # Collect sources
        docs = state.get("docs", [])
        history_turns = state.get("history", [])
        long_memory = state.get("long_memory", [])

        # Build context
        report_context = "\n".join([d.get("chunk", "") for d in docs]) or "No report context found."
        short_context = "\n".join(history_turns) or "No short-term memory."
        long_context = "\n".join(long_memory) or "No long-term memory."

        prompt = (
            "You are a medical assistant. Always ground answers in the given data. "
            "Do NOT hallucinate or invent test values. "
            "Blend report information with patient history when relevant.\n\n"
            f"--- Current Query ---\n{query}\n\n"
            f"--- Report Context ---\n{report_context}\n\n"
            f"--- Recent Conversation (short-term) ---\n{short_context}\n\n"
            f"--- Summarized Past Memory (long-term) ---\n{long_context}\n\n"
            "Answer in a safe, patient-friendly way:"
        )

        try:
            response = self.llm.ask(prompt)
            state["reasoning"] = response.strip()
        except Exception as e:
            state["reasoning"] = f"⚠️ LLM error: {e}"

        return state
