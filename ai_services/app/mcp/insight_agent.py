import re
import json
import asyncio
import traceback
from datetime import datetime
from app.mcp.mcp_tools import (
    blob_read_json,
    blob_write_json,
    mongo_find_one,
)
from app.storage.mongo_client import db


# --------------------------------------------------------
# 1️⃣ Extract measurable biomarkers from cleaned report
# --------------------------------------------------------
def compute_health_metrics(current: dict, previous: dict | None = None):
    """Extract measurable biomarkers from cleaned report text."""

    sections = current.get("sections", {})
    tests_block = sections.get("tests", "")
    cleaned_text = current.get("cleaned_text", "")
    text = f"{tests_block}\n{cleaned_text}"

    def extract(pattern):
        match = re.search(pattern, text, re.IGNORECASE)
        return float(match.group(1)) if match else None

    insights = {
        "fbs": extract(r"Fasting Plasma Glucose.*?:\s*([\d.]+)"),
        "total_chol": extract(r"Cholesterol\s*-\s*Total.*?:\s*([\d.]+)"),
        "ldl": extract(r"Cholesterol\s*L\.?D\.?L\.?.*?:\s*([\d.]+)"),
        "hdl": extract(r"Cholesterol[-\s]*H\.?D\.?L\.?.*?:\s*([\d.]+)"),
        "triglycerides": extract(r"Triglycerides.*?:\s*([\d.]+)"),
        "haemoglobin": extract(r"Haemoglobin.*?:\s*([\d.]+)"),
        "wbc": extract(r"Total White Cell Count.*?:\s*([\d.]+)"),
        "platelets": extract(r"Platelet Count.*?:\s*([\d.]+)"),
        "hba1c": extract(r"HbA1c.*?:\s*([\d.]+)"),
    }

    # Compare with previous insights
    if previous:
        insights["trend"] = {}
        prev_insights = previous.get("insights", previous)
        for k, v in insights.items():
            if k in prev_insights and v and prev_insights[k]:
                diff = v - prev_insights[k]
                insights["trend"][k] = "↑" if diff > 0 else "↓"
                insights[f"{k}_change"] = diff

    return insights


# --------------------------------------------------------
# 2️⃣ Generate summary
# --------------------------------------------------------
def make_summary(insights: dict) -> str:
    fbs, ldl, hdl = insights.get("fbs"), insights.get("ldl"), insights.get("hdl")
    trig, hgb = insights.get("triglycerides"), insights.get("haemoglobin")

    parts = []
    if fbs is not None:
        if fbs < 70:
            parts.append(f"Fasting glucose ({fbs} mg/dL) is low.")
        elif fbs <= 99:
            parts.append(f"Fasting glucose ({fbs} mg/dL) is normal.")
        elif fbs <= 125:
            parts.append(f"Fasting glucose ({fbs} mg/dL) indicates prediabetes.")
        else:
            parts.append(f"Fasting glucose ({fbs} mg/dL) is high.")

    if ldl is not None:
        if ldl < 130:
            parts.append(f"LDL ({ldl} mg/dL) is desirable.")
        elif ldl <= 159:
            parts.append(f"LDL ({ldl} mg/dL) is borderline.")
        else:
            parts.append(f"LDL ({ldl} mg/dL) is high — consider dietary control.")

    if hdl is not None:
        if hdl < 40:
            parts.append(f"HDL ({hdl} mg/dL) is low (less protective).")
        elif hdl < 60:
            parts.append(f"HDL ({hdl} mg/dL) is okay.")
        else:
            parts.append(f"HDL ({hdl} mg/dL) is excellent.")

    if trig is not None:
        parts.append(f"Triglycerides ({trig} mg/dL) are elevated." if trig > 150 else f"Triglycerides ({trig} mg/dL) are normal.")
    if hgb is not None:
        parts.append(f"Haemoglobin ({hgb} g/dL) looks healthy.")

    if not parts:
        parts.append("No measurable biomarkers detected in this report.")

    return " ".join(parts)


# --------------------------------------------------------
# 3️⃣ Main agent (only saves to insights_history)
# --------------------------------------------------------
async def run_insight_agent_mcp(case_id: str, user_id: str):
    """Run insight computation and store to insights_history only."""

    try:
        print(f"🧠 Starting Insight Agent for case={case_id}, user={user_id}")

        # Step 1: Wait for cleaned.json
        current = None
        for attempt in range(3):
            try:
                current = blob_read_json(case_id, f"cases/{case_id}/cleaned.json")
                if current:
                    break
            except Exception:
                print(f"⚠️ Attempt {attempt+1}/3 — cleaned.json not ready, retrying...")
                await asyncio.sleep(2)

        if not current:
            raise ValueError("cleaned.json not found or unreadable.")

        # Step 2: Get previous report (for trend)
        prev_case = mongo_find_one("cases", {"userId": user_id, "_id": {"$ne": case_id}})
        previous = None
        if prev_case and prev_case.get("cleaned_path"):
            try:
                previous = blob_read_json(prev_case["_id"], prev_case["cleaned_path"])
            except Exception:
                print(f"⚠️ Could not read previous cleaned report for {user_id}")

        # Step 3: Compute metrics
        insights = compute_health_metrics(current, previous)
        summary = make_summary(insights)
        timestamp = datetime.utcnow().isoformat()

        result_doc = {
            "userId": user_id,
            "caseId": case_id,
            "insights": insights,
            "summary": summary,
            "timestamp": timestamp,
        }

        # Step 4: Write insights.json to blob
        blob_result = blob_write_json(case_id, f"cases/{case_id}/insights.json", result_doc)

        # Step 5: Save to insights_history only
        db["insights_history"].insert_one({
            **result_doc,
            "blobPath": blob_result["path"],
            "createdAt": datetime.utcnow(),
        })

        print(f"✅ Insight Agent finished for {user_id} — history saved.")
        return {
            "status": "success",
            "message": "Insights computed & stored in insights_history.",
            "blob_path": blob_result["path"],
            "data": result_doc,
        }

    except Exception as e:
        print(f"❌ Insight Agent Error: {e}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e),
            "case_id": case_id,
            "user_id": user_id,
        }
