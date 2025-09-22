# app/chatbot/agents/faithfulness.py
from typing import Dict, Any
from .base import BaseAgent
from app.chatbot.services.llm_service import LLMService

class FaithfulnessCheckerAgent(BaseAgent):
    """
    Ensures the final response is grounded in retrieved report chunks,
    short-term conversation history, or long-term memory summaries.
    """

    def __init__(self):
        self.llm = LLMService()

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        response = state.get("response", "")
        report_context = "\n".join([d.get("chunk", "") for d in state.get("docs", [])])
        short_context = "\n".join(state.get("history", []))
        long_context = "\n".join(state.get("long_memory", []))

        sources = f"{report_context}\n{short_context}\n{long_context}"
        if not sources.strip():
            state["response"] = (
                "⚠️ I don’t have enough report or memory data to answer safely."
            )
            return state

        prompt = (
            "You are a strict medical fact-checker. "
            "Determine if the assistant’s response is grounded in the provided sources. "
            "If grounded, return: Faithful. "
            "If it contains hallucination (info not in sources), return: Not Faithful.\n\n"
            f"--- Sources ---\n{sources}\n\n"
            f"--- Assistant Response ---\n{response}\n\n"
            "Answer with only 'Faithful' or 'Not Faithful'."
        )

        try:
            verdict = self.llm.ask(prompt).strip()
        except Exception as e:
            state["response"] += f"\n\n⚠️ Faithfulness check error: {e}"
            return state

        if verdict.lower().startswith("not"):
            state["response"] += (
                "\n\n⚠️ Disclaimer: Some parts of this response may not be directly supported "
                "by your medical report or memory history. Please verify with your doctor."
            )

        return state
