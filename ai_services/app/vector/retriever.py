# app/vector/retriever.py
import os
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
from langchain_huggingface import HuggingFaceEmbeddings

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "medscribe_cases")

# Connect to Qdrant Cloud
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# Embeddings model
embeddings = HuggingFaceEmbeddings(model_name=os.getenv("HF_EMBED_MODEL"))

def retrieve_from_qdrant(user_id: str, query: str, top_k: int = 5):
    """
    Search Qdrant for similar chunks belonging to this user.
    """
    vector = embeddings.embed_query(query)

    search_result = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="user_id",
                    match=MatchValue(value=user_id)
                )
            ]
        ),
        limit=top_k
    )

    docs = []
    for hit in search_result:
        docs.append({
            "content": hit.payload.get("text"),
            "score": hit.score
        })

    return docs
