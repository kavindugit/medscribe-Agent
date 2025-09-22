# app/chatbot/services/retriever_service.py
from app.vector.retriever import retrieve_chunks

class RetrieverService:
    def retrieve(self, query: str, case_id: str, user_id: str, top_k: int = 5):
        return retrieve_chunks(query=query, case_id=case_id, user_id=user_id, top_k=top_k)["results"]
