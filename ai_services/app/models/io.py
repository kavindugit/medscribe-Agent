from pydantic import BaseModel
from typing import List, Optional
from app.models.domain import Panel

class IngestStats(BaseModel):
    pages: int
    ocr_used: bool

class ProcessResponse(BaseModel):
    case_id: str
    panels: List[Panel]
    ingest_stats: IngestStats
    message: Optional[str] = None
