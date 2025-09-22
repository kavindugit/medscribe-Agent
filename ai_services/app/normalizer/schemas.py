# app/normalizer/schemas.py
from typing import Dict
from pydantic import BaseModel


class CleanedSignals(BaseModel):
    page_numbers_removed: bool = False
    watermark_removed: bool = False
    lines_dropped: int = 0
    ocr_needed: bool = False


class CleanedPayload(BaseModel):
    cleaned_text: str
    sections: Dict[str, str]
    signals: CleanedSignals
    version: int = 1
