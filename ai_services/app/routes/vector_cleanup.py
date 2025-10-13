# app/routes/vector_cleanup.py
from fastapi import APIRouter, HTTPException

from app.vector.indexer import delete_case_embeddings

router = APIRouter(prefix="/vector", tags=["vector"])

@router.delete("/cleanup/{case_id}")
async def cleanup_case_embeddings(case_id: str):
    """
    DELETE /vector/cleanup/{case_id}
    Remove all embeddings in Qdrant related to this case.
    """
    try:
        result = delete_case_embeddings(case_id)
        return {"message": f"Embeddings for case {case_id} deleted successfully", "result": str(result)}
    except Exception as e:
        print(f"❌ Cleanup error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete embeddings for case {case_id}")
