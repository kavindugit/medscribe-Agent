import re

def classify_intent(query: str) -> str:
    """
    Detect only LIST_REPORTS. Everything else goes through the pipeline.
    """
    q = query.strip().lower()

    list_patterns = [
        r"\blist\b.*\breports?\b",
        r"\bshow\b.*\breports?\b",
        r"\bwhat\b.*\breports?\b",
        r"\bmy reports?\b",
        r"\bpast reports?\b",
        r"\buploaded reports?\b",
        r"\ball cases?\b",
        r"\bmy cases?\b",
        r"\bshow\b.*\bfiles?\b",
    ]

    if any(re.search(p, q) for p in list_patterns):
        return "LIST_REPORTS"

    return "OTHER"   # everything else handled in pipeline
