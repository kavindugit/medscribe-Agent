# app/storage/faiss_store.py
from __future__ import annotations
from pathlib import Path
import pickle
from typing import Tuple

BASE = Path("storage") / "cases"

def faiss_paths(case_id: str) -> Tuple[Path, Path]:
    d = BASE / case_id
    d.mkdir(parents=True, exist_ok=True)
    return d / "index.faiss", d / "index.pkl"

def save_vectorstore(vs, case_id: str) -> None:
    import faiss
    idx_path, pkl_path = faiss_paths(case_id)
    faiss.write_index(vs.index, str(idx_path))
    with open(pkl_path, "wb") as f:
        pickle.dump(
            {"docstore": vs.docstore, "index_to_docstore_id": vs.index_to_docstore_id},
            f,
        )

def load_vectorstore(case_id: str, embeddings):
    import faiss
    from langchain_community.vectorstores import FAISS
    idx_path, pkl_path = faiss_paths(case_id)
    if not (idx_path.exists() and pkl_path.exists()):
        return None
    index = faiss.read_index(str(idx_path))
    with open(pkl_path, "rb") as f:
        meta = pickle.load(f)
    return FAISS(embedding_function=embeddings, index=index, **meta)
