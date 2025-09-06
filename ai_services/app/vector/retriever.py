import os
from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

# -----------------------------
# ENV config
# -----------------------------
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION = os.getenv("QDRANT_COLLECTION", "medscribe_cases")

# -----------------------------
# Init clients
# -----------------------------
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# -----------------------------
# Ensure collection + indexes
# -----------------------------
def ensure_collection():
    """Ensure Qdrant collection exists with all required payload indexes."""
    required_fields = {"case_id", "user_id", "report_name", "doctor", "hospital"}

    try:
        coll_info = qdrant.get_collection(COLLECTION)
        # Get already indexed fields
        existing_indexes = set(coll_info.payload_schema.keys())

        missing = required_fields - existing_indexes
        for field in missing:
            qdrant.create_payload_index(
                collection_name=COLLECTION,
                field_name=field,
                field_schema="keyword",
            )
            print(f"✅ Added missing index: {field}")

        return
    except Exception:
        pass

    # If collection doesn’t exist → create it fresh
    qdrant.recreate_collection(
        collection_name=COLLECTION,
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    )

    for field in required_fields:
        qdrant.create_payload_index(
            collection_name=COLLECTION,
            field_name=field,
            field_schema="keyword",
        )

    print(f"✅ Created Qdrant collection with indexes: {COLLECTION}")


# -----------------------------
# Retriever
# -----------------------------
def retrieve_chunks(
    query: str,
    case_id: Optional[str] = None,
    user_id: Optional[str] = None,
    top_k: int = 5,
) -> Dict:
    """
    Given a query, search Qdrant for the most relevant chunks.
    Returns:
      {
        "meta": { case_id, user_id, report_name, doctor, hospital },
        "results": [ { "score", "chunk" }, ... ]
      }
    """
    ensure_collection()

    # Encode query
    query_vector = encoder.encode(query, convert_to_tensor=False).tolist()

    # Build filters
    must_filters = []
    if user_id:
        must_filters.append(models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id)))
    if case_id:
        must_filters.append(models.FieldCondition(key="case_id", match=models.MatchValue(value=case_id)))

    try:
        results = qdrant.search(
            collection_name=COLLECTION,
            query_vector=query_vector,
            query_filter=models.Filter(must=must_filters) if must_filters else None,
            limit=top_k,
        )
    except Exception as e:
        raise RuntimeError(f"Retriever error: {e}")

    if not results:
        return {"meta": {}, "results": []}

    # ✅ meta = same across all chunks → take first
    first = results[0].payload or {}
    meta = {
        "case_id": first.get("case_id"),
        "user_id": first.get("user_id"),
        "report_name": first.get("report_name"),
        "doctor": first.get("doctor"),
        "hospital": first.get("hospital"),
    }

    simplified = [{"score": r.score, "chunk": r.payload.get("chunk")} for r in results]

    return {"meta": meta, "results": simplified}
