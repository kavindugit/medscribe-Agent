# app/chatbot/agents/base.py
from typing import Dict, Any
from abc import ABC, abstractmethod

class BaseAgent(ABC):
    """Abstract base class for all agents in the chatbot pipeline."""

    @abstractmethod
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Takes current pipeline state, returns updated state."""
        pass
