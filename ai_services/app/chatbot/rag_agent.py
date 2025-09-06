import json
from typing import Dict, Any, List

from app.vector.retriever import retrieve_chunks
from app.storage.azure_client import container_client
from app.storage.mongo_client import get_cases_collection


from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import os
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



def rag_answer(user_id: str, query: str, case_id: str, top_k: int = 5) -> str:
    """
    Generate an answer using hybrid RAG:
    - semantic chunks from Qdrant
    - structured data (panels.json + cleaned.json) from Azure
    """

    # 1. Retrieve semantic context from Qdrant
    retrieved = retrieve_chunks(query=query, case_id=case_id, user_id=user_id, top_k=top_k)
    chunks = [r["chunk"] for r in retrieved.get("results", [])]

    # 2. Load structured files (panels + cleaned)
    cases = get_cases_collection()
    case = cases.find_one({"_id": case_id})
    panels, cleaned = {}, {}

    if case:
        if "panels_path" in case:
            panels = _load_json_from_blob(case["panels_path"])
        if "cleaned_path" in case:
            cleaned = _load_json_from_blob(case["cleaned_path"])

    # 3. Build prompt
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", 
         "You are a medical assistant. Always ground answers in the provided medical report. "
         "If data is missing, say you don’t know. Answer in a safe, patient-friendly way. "
         "Never make up lab values or diagnoses."),
        ("human", 
         "User query: {query}\n\n"
         "Relevant report sections:\n{chunks}\n\n"
         "Structured lab results:\n{panels}\n\n"
         "Full report summary:\n{cleaned}\n\n"
         "Now provide a helpful explanation.")
    ])

    formatted_prompt = prompt_template.format(
        query=query,
        chunks="\n".join(chunks) if chunks else "No semantic matches.",
        panels=json.dumps(panels, indent=2) if panels else "No panels available.",
        cleaned=json.dumps(cleaned.get("sections", {}), indent=2) if cleaned else "No cleaned data available.",
    )

    # 4. Get response from LLM
    try:
        response = llm.invoke(formatted_prompt)
        return response.content
    except Exception as e:
        return f"⚠️ RAG error: {e}"
