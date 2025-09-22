import os
from langchain_google_genai import ChatGoogleGenerativeAI

class GeneralHealthAgent:
    """
    Answers general health questions without relying on RAG.
    Provides safe, patient-friendly, general information.
    """

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=os.getenv("LLM_FALLBACK_MODEL", "gemini-1.5-flash"),
            api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.3,
        )

    def run(self, state: dict) -> dict:
        query = state["query"]
        prompt = (
            "You are a trusted medical assistant. Answer the following question "
            "in a safe, general, patient-friendly way. "
            "Do not provide diagnoses or treatment plans. "
            "If it's about prevention or lifestyle, provide clear advice.\n\n"
            f"Question: {query}"
        )
        try:
            resp = self.llm.invoke(prompt)
            state["response"] = resp.content
        except Exception as e:
            state["response"] = f"⚠️ General health answer unavailable ({e})"
        return state
