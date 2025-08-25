# app/storage/faiss_store.py
from __future__ import annotations
from pathlib import Path
import pickle
from typing import Tuple, Literal
from langchain_community.vectorstores import FAISS

# Bases (case-level is what you already used)
CASES_BASE = Path("storage") / "cases"
USERS_BASE = Path("storage") / "users"

def _faiss_paths(scope: Literal["case", "user"], ident: str) -> Tuple[Path, Path]:
    if scope == "case":
        d = CASES_BASE / ident
    else:
        d = USERS_BASE / ident
    d.mkdir(parents=True, exist_ok=True)
    return d / "index.faiss", d / "index.pkl"

# ---- legacy compatibility (case-level only) ----
def faiss_paths(case_id: str) -> Tuple[Path, Path]:
    return _faiss_paths("case", case_id)

# ---- generic helpers (work for case or user) ----
def save_vectorstore(vs: FAISS, ident: str, scope: Literal["case", "user"] = "case") -> None:
    import faiss
    idx_path, pkl_path = _faiss_paths(scope, ident)
    faiss.write_index(vs.index, str(idx_path))
    with open(pkl_path, "wb") as f:
        pickle.dump(
            {"docstore": vs.docstore, "index_to_docstore_id": vs.index_to_docstore_id},
            f,
        )

def load_vectorstore(ident: str, embeddings, scope: Literal["case", "user"] = "case") -> FAISS | None:
    import faiss
    idx_path, pkl_path = _faiss_paths(scope, ident)
    if not (idx_path.exists() and pkl_path.exists()):
        return None
    index = faiss.read_index(str(idx_path))
    with open(pkl_path, "rb") as f:
        meta = pickle.load(f)
    return FAISS(embedding_function=embeddings, index=index, **meta)

def has_index(ident: str, scope: Literal["case", "user"] = "case") -> bool:
    idx, meta = _faiss_paths(scope, ident)
    return idx.exists() and meta.exists()

# ---- convenience aliases for readability ----
def save_case_vs(vs: FAISS, case_id: str) -> None:
    save_vectorstore(vs, case_id, "case")

def save_user_vs(vs: FAISS, user_id: str) -> None:
    save_vectorstore(vs, user_id, "user")

def load_case_vs(case_id: str, embeddings) -> FAISS | None:
    return load_vectorstore(case_id, embeddings, "case")

def load_user_vs(user_id: str, embeddings) -> FAISS | None:
    return load_vectorstore(user_id, embeddings, "user")

def has_case_index(case_id: str) -> bool:
    return has_index(case_id, "case")

def has_user_index(user_id: str) -> bool:
    return has_index(user_id, "user")
