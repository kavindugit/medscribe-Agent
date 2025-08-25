# app/embeddings/build_index.py
from __future__ import annotations
import os
from typing import List
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings  # local, no API
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

from app.storage import get_json
from app.storage.cases import load_raw, load_meta
from app.storage.faiss_store import (
    save_case_vs, save_user_vs,
    has_index, has_user_index,
    load_user_vs,
)

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
    vs_case = FAISS.from_documents(chunks, embedding=embeddings)

    # save per-case index
    save_case_vs(vs_case, case_id)
    print(f"[index] built {len(chunks)} chunks for {case_id}")

    # 5) also merge into per-user aggregated index
    try:
        meta = load_meta(case_id)
        user_id = meta.get("user_id") or "anon"

        if has_user_index(user_id):
            vs_user = load_user_vs(user_id, embeddings)
            # merge in-memory
            vs_user.merge_from(vs_case)
        else:
            vs_user = vs_case  # first case for this user

        save_user_vs(vs_user, user_id)
        print(f"[user-index] merged case {case_id} into user {user_id}")
    except Exception as e:
        import sys, traceback
        print(f"[user-index] merge failed for case {case_id}: {e}", file=sys.stderr)
        traceback.print_exc()

    return len(chunks)

def build_index_background(case_id: str) -> None:
    try:
        if has_index(case_id, scope="case"):
            print(f"[index] case {case_id}: already indexed; skipping")
            return
        build_index_hf(case_id)
    except Exception as e:
        import sys, traceback
        print(f"[index] build failed for {case_id}: {e}", file=sys.stderr)
        traceback.print_exc()
