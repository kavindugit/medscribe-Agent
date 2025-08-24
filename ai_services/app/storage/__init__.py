# app/storage/__init__.py
from .cases import put_json, get_json  # re-export helpers for easy import

__all__ = ["put_json", "get_json"]
