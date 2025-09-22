# app/chatbot/memory/base.py
from typing import Dict, Any, List
from abc import ABC, abstractmethod

class BaseMemory(ABC):
    """Abstract base class for chatbot memory."""

    @abstractmethod
    def load(self, user_id: str, case_id: str | None = None, limit: int = 5) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def save(self, user_id: str, case_id: str, query: str, answer: str) -> None:
        pass
