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
            temperature=0.5,   # slightly higher for richer responses
        )

    def run(self, state: dict) -> dict:
        query = state["query"]
        prompt = (
            "You are a trusted medical assistant. The user is asking a general health question.\n"
            "Answer in a clear, helpful, and patient-friendly way. Include practical lifestyle "
            "tips (e.g., diet, exercise, sleep, stress management) if relevant.\n\n"
            "⚠️ Do not give diagnoses or prescriptions.\n"
            "End with a disclaimer: 'This is general advice, please consult your doctor for personalized guidance.'\n\n"
            f"Question: {query}"
        )
        try:
            resp = self.llm.invoke(prompt)
            state["response"] = resp.content
        except Exception as e:
            state["response"] = f"⚠️ General health answer unavailable ({e})"
        return state
