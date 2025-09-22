# app/storage/qdrant_client.py
import os
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Qdrant   # ✅ use community version

# Load env vars
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
EMBED_MODEL = os.getenv("HF_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Init client + embeddings
qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
)

embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL)

def get_or_create_collection(name: str):
    """Ensure collection exists in Qdrant"""
    try:
        qdrant_client.get_collection(name)
    except Exception:
        qdrant_client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
        # ✅ add payload indexes for filtering
        qdrant_client.create_payload_index(
            collection_name=name,
            field_name="user_id",
            field_schema="keyword"
        )
        qdrant_client.create_payload_index(
            collection_name=name,
            field_name="case_id",
            field_schema="keyword"
        )


def get_qdrant_vectorstore(collection_name: str):
    """Return LangChain-compatible Qdrant vectorstore"""
    get_or_create_collection(collection_name)
    return Qdrant(client=qdrant_client, collection_name=collection_name, embeddings=embeddings)
