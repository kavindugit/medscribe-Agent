# app/storage/qdrant_client.py
import os
import time
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from qdrant_client.http.exceptions import UnexpectedResponse
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Qdrant  # ✅ use community version

# Load environment variables
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
EMBED_MODEL = os.getenv("HF_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# ✅ Initialize Qdrant client
try:
    qdrant_client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        timeout=30,  # prevent long hang
    )
    print(f"✅ Connected to Qdrant at {QDRANT_URL}")
except Exception as e:
    print(f"❌ Failed to connect to Qdrant: {e}")
    qdrant_client = None

# ✅ Initialize embeddings
embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL)


def get_or_create_collection(name: str):
    """Ensure the Qdrant collection exists, safely ignoring 'already exists' errors."""
    if not qdrant_client:
        raise RuntimeError("Qdrant client not initialized — check QDRANT_URL/API key.")

    try:
        qdrant_client.get_collection(name)
        print(f"ℹ️ Qdrant collection '{name}' already exists.")
    except UnexpectedResponse as e:
        err_msg = str(e).lower()
        if "not found" in err_msg:
            print(f"🆕 Creating new Qdrant collection: {name}")
            qdrant_client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )

            # ✅ Add payload indexes
            for field in ["user_id", "case_id"]:
                qdrant_client.create_payload_index(
                    collection_name=name,
                    field_name=field,
                    field_schema="keyword"
                )
        elif "already exists" in err_msg:
            print(f"ℹ️ Qdrant collection '{name}' already exists — skipping.")
        else:
            raise
    except Exception as e:
        print(f"⚠️ Could not verify Qdrant collection '{name}': {e}")


def get_qdrant_vectorstore(collection_name: str):
    """Return LangChain-compatible Qdrant vectorstore."""
    get_or_create_collection(collection_name)
    return Qdrant(client=qdrant_client, collection_name=collection_name, embeddings=embeddings)
