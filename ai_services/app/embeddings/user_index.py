# app/embeddings/user_index.py
from __future__ import annotations
import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from app.storage.cases import load_meta
from app.storage.faiss_store import (
    save_user_vs, has_user_index, load_vectorstore, save_case_vs, has_case_index, load_vectorstore as load_vs_generic
)
from app.storage.faiss_store import load_vectorstore as load_vs  # alias

MODEL_NAME = os.getenv("HF_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

def _emb() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=MODEL_NAME)

def merge_case_into_user_index(case_id: str) -> str:
    """
    Read user_id from meta.json of the case, then merge case FAISS into the user's FAISS.
    Creates the user FAISS if it doesn't exist.
    """
    meta = load_meta(case_id)
    user_id = meta.get("user_id") or "anon"

    emb = _emb()

    # load case vectorstore
    if not has_case_index(case_id):
        raise FileNotFoundError(f"Case index not found for {case_id}")
    vs_case = load_vs(case_id, emb, scope="case")

    # create or load user vectorstore
    if has_user_index(user_id):
        vs_user = load_vs(user_id, emb, scope="user")
        vs_user.merge_from(vs_case)
    else:
        vs_user = vs_case

    save_user_vs(vs_user, user_id)
    return user_id
