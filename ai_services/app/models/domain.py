from pydantic import BaseModel
from typing import List, Optional, Literal

class LabItem(BaseModel):
    name: str
    result: float
    unit: Optional[str] = None
    ref_text: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    flag: Optional[Literal["H","L"]] = None
    status: Literal["Normal","Slightly Abnormal","Abnormal","Critical"] = "Normal"
    status_reason: str = "Not evaluated yet"

class Panel(BaseModel):
    title: str
    items: List[LabItem] = []
