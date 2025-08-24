# app/embeddings/build_index.py
from __future__ import annotations
import os
from typing import List
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings  # <— local, no API
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

from app.storage import get_json
from app.storage.cases import load_raw
from app.storage.faiss_store import save_vectorstore, has_index

MODEL_NAME = os.getenv("HF_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

def _collect_text_from_cleaned(cleaned: dict) -> List[Document]:
    docs: List[Document] = []
    sections = cleaned.get("sections")
    if isinstance(sections, dict) and sections:
        for name, text in sections.items():
            if text and str(text).strip():
                docs.append(Document(page_content=str(text).strip(),
                                     metadata={"section": name}))
    else:
        text = (cleaned.get("text") or "").strip()
        if text:
            docs.append(Document(page_content=text, metadata={"section": "full"}))
    return docs

def build_index_hf(case_id: str) -> int:
    # 1) load cleaned
    cleaned = get_json(case_id, "cleaned.json")
    if cleaned is None:
        raise FileNotFoundError("cleaned.json not found")

    # 2) gather docs (fallback to raw)
    docs = _collect_text_from_cleaned(cleaned)
    if not docs:
        raw = (load_raw(case_id) or "").strip()
        if raw:
            docs = [Document(page_content=raw, metadata={"section": "raw_fallback"})]
    if not docs:
        print(f"[index] case {case_id}: no text found in cleaned.json or raw.txt")
        return 0

    print(f"[index] case {case_id}: building from {len(docs)} doc(s) using local embeddings: {MODEL_NAME}")

    # 3) chunk
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800, chunk_overlap=120,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    if not chunks:
        print(f"[index] case {case_id}: splitter produced 0 chunks")
        return 0

    # 4) local embeddings (no API / no key)
    embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    vs = FAISS.from_documents(chunks, embedding=embeddings)
    save_vectorstore(vs, case_id)
    print(f"[index] built {len(chunks)} chunks for {case_id}")
    return len(chunks)

def build_index_background(case_id: str) -> None:
    try:
        if has_index(case_id):
            print(f"[index] case {case_id}: already indexed; skipping")
            return
        build_index_hf(case_id)
    except Exception as e:
        import sys, traceback
        print(f"[index] build failed for {case_id}: {e}", file=sys.stderr)
        traceback.print_exc()
