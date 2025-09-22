import uuid
from typing import List
from datetime import datetime
from app.storage.qdrant_client import qdrant_client, embeddings, get_or_create_collection

class LongTermMemory:
    COLLECTION = "conversation_memory"

    def __init__(self):
        get_or_create_collection(self.COLLECTION)

    def save_summary(self, user_id: str, case_id: str, summary: str, max_summaries: int = 20) -> None:
        """Save a summary and silently cleanup older ones beyond `max_summaries`."""
        vector = embeddings.embed_query(summary)

        qdrant_client.upsert(
            collection_name=self.COLLECTION,
            points=[{
                "id": str(uuid.uuid4()),
                "vector": vector,
                "payload": {
                    "user_id": user_id,
                    "case_id": case_id,
                    "summary": summary,
                    "created_at": datetime.utcnow().isoformat()
                }
            }]
        )

        # Silent cleanup
        self.cleanup_old_summaries(user_id, case_id, max_summaries)

    def search(self, query: str, user_id: str, case_id: str, top_k: int = 3) -> List[str]:
        """Search summaries using semantic similarity + filters."""
        vector = embeddings.embed_query(query)
        results = qdrant_client.search(
            collection_name=self.COLLECTION,
            query_vector=vector,
            limit=top_k,
            query_filter={"must": [
                {"key": "user_id", "match": {"value": user_id}},
                {"key": "case_id", "match": {"value": case_id}}
            ]}
        )
        return [r.payload["summary"] for r in results]

    def cleanup_old_summaries(self, user_id: str, case_id: str, max_summaries: int = 20) -> None:
        """Keep only the `max_summaries` most recent summaries per user/case."""
        results = qdrant_client.scroll(
            collection_name=self.COLLECTION,
            scroll_filter={"must": [
                {"key": "user_id", "match": {"value": user_id}},
                {"key": "case_id", "match": {"value": case_id}}
            ]},
            limit=1000
        )

        points = results[0] if results else []
        if len(points) <= max_summaries:
            return

        # Sort by timestamp
        sorted_points = sorted(
            points,
            key=lambda p: p.payload.get("created_at", ""),
            reverse=True
        )

        # Delete oldest beyond limit
        to_delete = [p.id for p in sorted_points[max_summaries:]]
        if to_delete:
            qdrant_client.delete(
                collection_name=self.COLLECTION,
                points_selector={"points": to_delete}
            )
