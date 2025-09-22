from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import os

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    api_key=GOOGLE_API_KEY,
    temperature=0.0
)

intent_prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You are an intent classifier for a medical report chatbot. "
     "Classify the user query into one of these labels ONLY:\n\n"
     "- LIST_REPORTS: user wants a list of uploaded reports (metadata only)\n"
     "- REPORT_QUESTION: user is asking about values, tests, results inside reports\n"
     "- GENERAL_HEALTH: user is asking about general medical/health advice not tied to a report\n"),
    ("human", "{query}")
])

def classify_intent(query: str) -> str:
    try:
        resp = llm.invoke(intent_prompt.format(query=query))
        label = (resp.content or "").strip().upper()
        if label not in ["LIST_REPORTS", "REPORT_QUESTION", "GENERAL_HEALTH"]:
            return "REPORT_QUESTION"
        return label
    except Exception:
        return "REPORT_QUESTION"  # fallback
