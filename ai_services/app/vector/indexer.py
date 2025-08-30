# app/vector/indexer.py
import os
import json
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer
from app.storage.azure_client import container_client
from app.storage.mongo_client import get_cases_collection

# -----------------------------
# ENV config
# -----------------------------
QDRANT_URL = os.getenv("QDRANT_URL")  # e.g. https://xxx.qdrant.cloud
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION = os.getenv("QDRANT_COLLECTION", "medscribe_cases")

# -----------------------------
# Init clients
# -----------------------------
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# -----------------------------
# Ensure collection exists
# -----------------------------
def ensure_collection():
    """Create collection if it does not exist."""
    try:
        qdrant.get_collection(COLLECTION)
    except Exception:
        qdrant.recreate_collection(
            collection_name=COLLECTION,
            vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        )
        print(f"✅ Created Qdrant collection: {COLLECTION}")

# -----------------------------
# Index a case into Qdrant
# -----------------------------
def index_case(case_id: str) -> int:
    """
    Load cleaned.json + panels.json for a case (from Azure),
    embed, and store in Qdrant.
    Returns number of chunks indexed.
    """
    ensure_collection()

    # --- find case in Mongo ---
    cases = get_cases_collection()
    case = cases.find_one({"_id": case_id})
    if not case:
        raise ValueError(f"❌ Case {case_id} not found in Mongo")

    chunks = []

    # --- download cleaned.json from Azure ---
    cleaned_blob = container_client.get_blob_client(case["cleaned_path"])
    cleaned_text = cleaned_blob.download_blob().readall().decode("utf-8")
    cleaned = json.loads(cleaned_text)

    # Extract structured sections
    for key, val in cleaned.get("sections", {}).items():
        if isinstance(val, str) and val.strip():
            for part in val.split("\n"):
                if part.strip():
                    chunks.append(f"{key.upper()}: {part.strip()}")

    # --- download panels.json from Azure ---
    try:
        panels_blob = container_client.get_blob_client(case["panels_path"])
        panels_text = panels_blob.download_blob().readall().decode("utf-8")
        panels = json.loads(panels_text)
        for p in panels:
            for item in p.get("items", []):
                name = item.get("name")
                result = item.get("result")
                unit = item.get("unit", "")
                ref = item.get("ref_text", "")
                if name and result is not None:
                    chunks.append(f"{name}: {result} {unit} (ref: {ref})")
    except Exception:
        print(f"⚠️ No panels.json found for case {case_id}")

    if not chunks:
        print(f"⚠️ No content to index for case {case_id}")
        return 0

    # --- embed ---
    print(f"🔄 Embedding {len(chunks)} chunks for case {case_id}...")
    embeddings = encoder.encode(chunks, show_progress_bar=False).tolist()

    # --- upsert into Qdrant ---
    points = []
    for i, (text, vector) in enumerate(zip(chunks, embeddings)):
        points.append(
            models.PointStruct(
                id=i,  # ✅ use integer ID (fixes Qdrant error)
                vector=vector,
                payload={
                    "case_id": case_id,
                    "chunk": text,
                    "report_name": case.get("report_name"),
                    "doctor": case.get("doctor"),
                    "hospital": case.get("hospital"),
                },
            )
        )

    qdrant.upsert(collection_name=COLLECTION, points=points)
    print(f"✅ Indexed {len(points)} chunks into Qdrant for case {case_id}")
    return len(points)
