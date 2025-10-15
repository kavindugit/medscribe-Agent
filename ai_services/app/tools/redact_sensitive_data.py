import re

SENSITIVE_PATTERNS = [
    # Patient information
    (r"\b(Patient Name|Name|Full Name|Patient)\s*[:\-]?\s*[A-Z][a-zA-Z ]+\b", "Patient: [REDACTED]"),
    (r"\b(NIC|National ID|ID Number)\s*[:\-]?\s*\w+", "NIC: [REDACTED]"),

    # Doctor / Consultant
    (r"\b(Doctor|Dr\.|Consultant|Physician)\s*[:\-]?\s*[A-Z][a-zA-Z ]+\b", "Doctor: [REDACTED]"),

    # Hospital / Clinic
    (r"\b(Hospital|Clinic|Laboratory|Lab|Medical Center|Institute)\s*[:\-]?\s*[A-Z][a-zA-Z ]+\b", "Hospital: [REDACTED]"),

    # Contact details
    (r"\b\d{9}[VvXx]\b", "[REDACTED NIC]"),
    (r"\b\d{10}\b", "[REDACTED PHONE]"),
    (r"\b\d{1,2}/\d{1,2}/\d{2,4}\b", "[REDACTED DATE]"),
    (r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", "[REDACTED EMAIL]"),
    (r"\b\d{1,3}[- ]\d{7}\b", "[REDACTED PHONE]"),
]

def redact_sensitive_data(text: str) -> str:
    """Redacts identifiable personal and institutional data from text."""
    if not text or not isinstance(text, str):
        return text

    cleaned = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.I)

    return cleaned
