# app/mcp/mcp_tools.py
from app.storage.azure_client import container_client
from app.storage.mongo_client import db
import json
from typing import Any, Dict

# -----------------------
#  TOOL: blob.read_json
# -----------------------
def blob_read_json(case_id: str, path: str) -> Dict[str, Any]:
    blob_path = path or f"cases/{case_id}/cleaned.json"
    blob_client = container_client.get_blob_client(blob_path)
    data = blob_client.download_blob().readall()
    return json.loads(data)

# -----------------------
#  TOOL: blob.write_json
# -----------------------
def blob_write_json(case_id: str, path: str, data: Dict[str, Any]):
    blob_path = path or f"cases/{case_id}/insights.json"
    blob_client = container_client.get_blob_client(blob_path)
    blob_client.upload_blob(json.dumps(data).encode(), overwrite=True)
    return {"status": "ok", "path": blob_path}

# -----------------------
#  TOOL: mongo.find_one
# -----------------------
def mongo_find_one(collection: str, filter_: Dict[str, Any]) -> Dict[str, Any]:
    col = db[collection]
    doc = col.find_one(filter_)
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

# -----------------------
#  TOOL: mongo.upsert
# -----------------------
def mongo_upsert(collection: str, filter_: Dict[str, Any], doc: Dict[str, Any]):
    col = db[collection]
    col.update_one(filter_, {"$set": doc}, upsert=True)
    return {"status": "ok", "filter": filter_}
