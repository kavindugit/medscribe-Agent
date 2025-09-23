# ai_services/app/chatbot/vector/retriever.py
from typing import Dict, Any, List
from app.storage.qdrant_client import get_qdrant_vectorstore, qdrant_client, embeddings
from qdrant_client.http import models as qmodels

def retrieve_chunks(query: str, case_id: str, user_id: str, top_k: int = 5) -> Dict[str, Any]:
    """Retrieve semantically relevant chunks from Qdrant for a user (optionally filtered by case)."""

    collection_name = f"user_{user_id}_cases"

    # ensure collection exists
    vs = get_qdrant_vectorstore(collection_name)

    # embed the query
    query_vector = embeddings.embed_query(query)

    # build filter dynamically
    filter_conditions: List[qmodels.FieldCondition] = [
        qmodels.FieldCondition(key="user_id", match=qmodels.MatchValue(value=user_id))
    ]
    if case_id:
        filter_conditions.append(
            qmodels.FieldCondition(key="case_id", match=qmodels.MatchValue(value=case_id))
        )

    results = qdrant_client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=top_k,
        query_filter=qmodels.Filter(must=filter_conditions)
    )

    # Convert to simple dict list
    return {
        "results": [
            {
                "chunk": r.payload.get("chunk", ""),
                "score": r.score,
                "case_id": r.payload.get("case_id")
            }
            for r in results
        ],
        "meta": {
            "collection": collection_name,
            "matched": len(results)
        }
    }
