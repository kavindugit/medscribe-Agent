# app/mcp/insight_agent.py
import json
from datetime import datetime
from app.mcp.mcp_tools import (
    blob_read_json,
    blob_write_json,
    mongo_find_one,
    mongo_upsert,
)
from app.storage.mongo_client import db   # ✅ add this import


def compute_health_metrics(current: dict, previous: dict | None = None):
    metrics = current.get("measurements", {})
    insights = {
        "bmi": metrics.get("bmi"),
        "bp_sys": metrics.get("bp_sys"),
        "bp_dia": metrics.get("bp_dia"),
        "hba1c": metrics.get("hba1c"),
        "ldl": metrics.get("ldl"),
    }

    if previous:
        insights["trend"] = {}
        for k, v in insights.items():
            if k in previous and v and previous[k]:
                diff = v - previous[k]
                insights["trend"][k] = "↑" if diff > 0 else "↓"
                insights[f"{k}_change"] = diff
    return insights


def make_summary(insights: dict) -> str:
    bp = f"{insights.get('bp_sys', '?')}/{insights.get('bp_dia', '?')}"
    bmi = insights.get("bmi")
    ldl = insights.get("ldl")
    hba1c = insights.get("hba1c")
    return (
        f"Blood Pressure: {bp}, BMI: {bmi}, LDL: {ldl}, HbA1c: {hba1c}. "
        "Maintain healthy habits to continue improving your results."
    )


async def run_insight_agent_mcp(case_id: str, user_id: str):
    # Step 1: Fetch current and previous cleaned JSONs
    current = blob_read_json(case_id, f"cases/{case_id}/cleaned.json")

    prev_case = mongo_find_one("cases", {"user_id": user_id, "_id": {"$ne": case_id}})
    previous = None
    if prev_case and prev_case.get("cleaned_path"):
        previous = blob_read_json(prev_case["_id"], prev_case["cleaned_path"])

    # Step 2: Compute insights + summary
    insights = compute_health_metrics(current, previous)
    summary = make_summary(insights)
    timestamp = datetime.utcnow().isoformat()

    result_doc = {
        "user_id": user_id,
        "case_id": case_id,
        "insights": insights,
        "summary": summary,
        "timestamp": timestamp,
    }

    # Step 3: Write to blob + user doc
    blob_result = blob_write_json(case_id, f"cases/{case_id}/insights.json", result_doc)
    mongo_upsert("users", {"_id": user_id}, {"latest_insights": result_doc})

    # Step 4: Save full insight to history for trend analysis
    history_col = db["insights_history"]
    history_col.insert_one({
        **result_doc,
        "blob_path": blob_result["path"],
        "created_at": datetime.utcnow(),
    })

    return {
        "status": "success",
        "message": "Insights computed & stored (latest + history)",
        "blob_path": blob_result["path"],
        "data": result_doc,
    }
