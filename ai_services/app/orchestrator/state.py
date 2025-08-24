from typing import TypedDict, List
from app.models.domain import Panel

class PipelineState(TypedDict):
    case_id: str
    panels: List[Panel]
    pages: int
    ocr_used: bool
