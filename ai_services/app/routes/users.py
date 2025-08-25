# app/routes/users.py
from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException, BackgroundTasks
from typing import Optional
from app.storage.faiss_store import has_user_index, save_user_vs
from app.storage.cases import list_cases_for_user
from app.embeddings.user_index import _emb
from app.storage.faiss_store import load_vectorstore as load_vs, save_user_vs
from app.storage.faiss_store import has_case_index
from langchain_community.vectorstores import FAISS

router = APIRouter(prefix="/users", tags=["users"])

def _require_owner(x_user_id: Optional[str], path_user_id: str) -> None:
    if x_user_id and x_user_id != path_user_id:
        raise HTTPException(status_code=403, detail="Forbidden: not your user id")

@router.get("/{user_id}/index/status")
def user_index_status(user_id: str, x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    _require_owner(x_user_id, user_id)
    return {"user_id": user_id, "indexed": has_user_index(user_id)}

@router.post("/{user_id}/index/rebuild")
def user_index_rebuild(user_id: str, background_tasks: BackgroundTasks,
                       x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")):
    _require_owner(x_user_id, user_id)
    background_tasks.add_task(_rebuild_user_index_task, user_id)
    return {"ok": True, "message": f"rebuild queued for {user_id}"}

def _rebuild_user_index_task(user_id: str) -> None:
    try:
        emb = _emb()
        # collect all case indexes for user
        case_ids = list_cases_for_user(user_id)
        vs_user: FAISS | None = None
        for cid in case_ids:
            if not has_case_index(cid):
                continue
            vs_case = load_vs(cid, emb, scope="case")
            if vs_user is None:
                vs_user = vs_case
            else:
                vs_user.merge_from(vs_case)
        if vs_user is not None:
            save_user_vs(vs_user, user_id)
            print(f"[user-index] rebuilt for user {user_id} from {len(case_ids)} cases")
        else:
            print(f"[user-index] no case indexes for user {user_id}; cleared/none")
    except Exception as e:
        import sys, traceback
        print(f"[user-index] rebuild failed for {user_id}: {e}", file=sys.stderr)
        traceback.print_exc()
