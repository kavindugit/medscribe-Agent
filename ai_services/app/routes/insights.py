# app/routes/insights.py
from fastapi import APIRouter, Header, HTTPException
from app.mcp.agent_registry import run_agent
from app.storage.mongo_client import db
from app.storage.mongo_client import get_users_collection
from app.storage.azure_client import get_sas_url
from app.storage.mongo_client import get_insights_history_collection


router = APIRouter(prefix="/insights", tags=["insights"])

@router.post("/generate/{case_id}")
async def generate_insights(case_id: str, x_user_id: str = Header(..., alias="X-User-Id")):
    """Run MCP-enabled insight agent."""
    try:
        result = await run_agent("insight_agent", case_id=case_id, user_id=x_user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{user_id}")
def get_user_insights(user_id: str):
    """Return latest insights for user profile dashboard."""
    users = get_users_collection()
    user = users.find_one({"_id": user_id})
    if not user or "latest_insights" not in user:
        raise HTTPException(status_code=404, detail="No insights found")

    insights = user["latest_insights"]
    blob_path = f"cases/{insights['case_id']}/insights.json"
    sas_url = get_sas_url(blob_path)
    return {"insights": insights, "sas_url": sas_url}


@router.get("/history/{user_id}")
def get_user_insight_history(user_id: str):
    """Return all historical insights for a user."""
    history_col = db["insights_history"]
    records = list(history_col.find({"user_id": user_id}).sort("created_at", 1))

    # Clean _id for JSON
    for r in records:
        r["_id"] = str(r["_id"])
    return {"count": len(records), "history": records}

@router.get("/trends/{user_id}")
def get_user_trends(user_id: str):
    col = get_insights_history_collection()
    records = list(col.find({"user_id": user_id}, {"_id": 0}).sort("created_at", 1))
    if not records:
        return {"count": 0, "message": "No insights found"}
    return {
        "count": len(records),
        "trends": [
            {
                "timestamp": r["timestamp"],
                "fbs": r["insights"].get("fbs"),
                "ldl": r["insights"].get("ldl"),
                "hdl": r["insights"].get("hdl"),
                "haemoglobin": r["insights"].get("haemoglobin"),
            }
            for r in records
        ],
    }    