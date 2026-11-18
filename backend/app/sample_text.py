"""The sample source from the prototype. The flaw switch is on for this text by default."""

from __future__ import annotations

SAMPLE_TEXT = (
    "A good team stand-up is short and predictable. "
    "Hold it at the same time every day, and keep it to 15 minutes. "
    "Each person answers three questions: what they did yesterday, what they will do today, "
    "and what is blocking them. "
    "Detailed discussions are parked and taken offline with the people involved. "
    "Every blocker is written down with an owner."
)

MIN_CHARS = 50
MAX_CHARS = 3000


def source_problem(source: str) -> str | None:
    """FR-1 length rule, so the loop is not asked to draft from an empty or huge paste."""
    count = len((source or "").strip())
    if count < MIN_CHARS:
        return f"Add at least {MIN_CHARS} characters. You have {count}."
    if count > MAX_CHARS:
        return f"Shorten the text to {MAX_CHARS:,} characters or fewer. You have {count:,}."
    return None
