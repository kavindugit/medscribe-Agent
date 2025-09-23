# ai_services/app/chatbot/agents/intent.py
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

class IntentClassifierAgent:
    """
    Classifies a query into one of:
      - report_question: user asks about their reports/results
      - general_health: user asks about general medical knowledge
    """

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=os.getenv("LLM_FALLBACK_MODEL", "gemini-1.5-flash"),
            api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.0,
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system",
             "Classify the user's query into one of these intents:\n"
             " - report_question (questions about their report, results, blood test, values)\n"
             " - general_health (general medical/health questions not tied to their personal report)\n"
             "Return ONLY the intent name."),
            ("human", "{query}")
        ])

    def run(self, state: dict) -> dict:
        query = state["query"]
        try:
            resp = self.llm.invoke(self.prompt.format(query=query))
            intent = (resp.content or "").strip().lower()
            if intent not in ["report_question", "general_health"]:
                intent = "report_question"  # fallback
        except Exception:
            intent = "report_question"
        state["intent"] = intent
        return state
