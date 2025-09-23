# ai_services/app/chatbot/agents/rag_agent.py
from typing import List, Dict, Any, Tuple
import json
import os
from app.vector.retriever import retrieve_chunks
from app.storage.azure_client import container_client
from app.storage.mongo_client import get_cases_collection
from app.storage.conversations_mongo import get_conversation_history
from app.chatbot.utils.case_resolver import resolve_case

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    api_key=GOOGLE_API_KEY,
    temperature=0.2,
)

def _load_json_from_blob(blob_path: str) -> Dict[str, Any]:
    try:
        blob_client = container_client.get_blob_client(blob_path)
        text = blob_client.download_blob().readall().decode("utf-8")
        return json.loads(text)
    except Exception as e:
        print(f"⚠️ Failed to load {blob_path}: {e}")
        return {}

def rag_answer(
    user_id: str,
    query: str,
    case_id: str | None,
    top_k: int = 5,
    history_turns: int = 3
) -> Tuple[str, Dict[str, Any], List[str]]:
    """
    Multi-turn RAG:
    - Resolve which case(s) to use
    - Retrieve chunks from Qdrant
    - Load structured panels + cleaned JSON
    - Append last N conversation turns as chat history
    Returns: (answer, memory_used, case_ids)
    """

    # 1️⃣ Resolve cases (auto if case_id not given)
    case_ids = resolve_case(user_id, query, case_id)

    # 2️⃣ Retrieve semantic context
    chunks = []
    for cid in case_ids:
        retrieved = retrieve_chunks(query=query, case_id=cid, user_id=user_id, top_k=top_k)
        chunks.extend([r["chunk"] for r in retrieved.get("results", [])])

    # 3️⃣ Load structured files
    cases = get_cases_collection()
    panels, cleaned = {}, {}
    for cid in case_ids:
        case = cases.find_one({"_id": cid})
        if case:
            if "panels_path" in case:
                panels[cid] = _load_json_from_blob(case["panels_path"])
            if "cleaned_path" in case:
                cleaned[cid] = _load_json_from_blob(case["cleaned_path"])

    # 4️⃣ Load conversation history
    history = get_conversation_history(user_id, case_ids[0] if case_ids else None)
    if history_turns > 0:
        history = history[-history_turns:]
    formatted_history = "\n".join(
        [f"User: {h['query']}\nAssistant: {h['answer']}" for h in history]
    ) or "No prior conversation."

    # 5️⃣ Build prompt
    prompt_template = ChatPromptTemplate.from_messages([
        ("system",
         "You are a medical assistant. Always ground answers in the provided medical reports. "
         "If data is missing, say you don’t know. Answer in a safe, patient-friendly way. "
         "Never make up lab values or diagnoses."),
        ("human",
         "Conversation so far:\n{history}\n\n"
         "Current user query: {query}\n\n"
         "Relevant report sections:\n{chunks}\n\n"
         "Structured lab results:\n{panels}\n\n"
         "Full report summary:\n{cleaned}\n\n"
         "Now provide a helpful explanation.")
    ])

    formatted_prompt = prompt_template.format(
        history=formatted_history,
        query=query,
        chunks="\n".join(chunks) if chunks else "No semantic matches.",
        panels=json.dumps(panels, indent=2) if panels else "No panels available.",
        cleaned=json.dumps(cleaned, indent=2) if cleaned else "No cleaned data available.",
    )

    # 6️⃣ Call LLM
    try:
        response = llm.invoke(formatted_prompt)
        return response.content, {"short_term": [formatted_history], "long_term": []}, case_ids
    except Exception as e:
        return f"⚠️ RAG error: {e}", {}, case_ids
