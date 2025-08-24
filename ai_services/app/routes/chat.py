# app/routes/chat.py  (or create app/routes/index.py if you want to separate)
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.storage.cases import load_meta
from app.embeddings.build_index import build_index_hf

router = APIRouter(prefix="/index", tags=["index"])

def _require_owner(x_user_id: Optional[str], meta_user_id: str) -> None:
    if meta_user_id and x_user_id and x_user_id != meta_user_id:
        raise HTTPException(status_code=403, detail="Forbidden: case not owned by user")

@router.post("/build/{case_id}")
def build_index(case_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    meta = load_meta(case_id)
    _require_owner(x_user_id, meta.get("user_id", ""))
    n = build_index_hf(case_id)
    return {"case_id": case_id, "chunks_indexed": n, "message": "HF index built"}

