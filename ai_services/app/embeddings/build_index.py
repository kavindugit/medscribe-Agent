from __future__ import annotations
import os
from typing import List
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

from app.storage.cases import get_json
from app.storage.faiss_store import save_vectorstore

# choose model via env or fallback
MODEL_NAME = os.getenv("HF_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

def _collect_text(cleaned: dict) -> List[Document]:
    """
    Prefer structured sections; fall back to single block.
    """
    docs: List[Document] = []
    # if you saved structured sections
    sections = cleaned.get("sections")
    if isinstance(sections, dict) and sections:
        for name, text in sections.items():
            if not text:
                continue
            docs.append(Document(page_content=str(text), metadata={"section": name}))
    else:
        text = cleaned.get("text") or ""
        if text.strip():
            docs.append(Document(page_content=text.strip(), metadata={"section": "full"}))
    return docs

def build_index_hf(case_id: str) -> int:
    """
    Load cleaned.json, chunk, embed via HF Inference API, and persist FAISS.
    Returns the number of chunks indexed.
    """
    cleaned = get_json(case_id, "cleaned.json")
    if cleaned is None:
        raise FileNotFoundError("cleaned.json not found")

    docs = _collect_text(cleaned)
    if not docs:
        raise ValueError("No content available in cleaned.json")

    # Chunk to ~512–800 chars; overlap helps continuity
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(docs)

    # HF Inference API embeddings (requires HUGGINGFACEHUB_API_KEY)
    embeddings = HuggingFaceInferenceAPIEmbeddings(model_name=MODEL_NAME)

    # Build and persist FAISS
    vs = FAISS.from_documents(chunks, embedding=embeddings)
    save_vectorstore(vs, case_id)
    return len(chunks)
