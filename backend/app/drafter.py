"""Stub Drafter (stands in for track 1, FR-2, until that agent is merged).

The loop calls ``draft_lesson(source, feedback, attempt, flaw)`` and expects the
lesson contract. On attempt 1 with the flaw switch on, the quote and the summary
are broken on purpose. Later attempts write a clean lesson from the source.
A real Drafter can replace this function and read ``feedback`` (the Reviewer's
issue sentences) to repair the draft.
"""

import re

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
_NUMBER = re.compile(r"\d+(?:[.,]\d+)?")
_NUMBER_WORD = re.compile(
    r"\b(one|two|three|four|five|six|seven|eight|nine|ten)\b",
    re.IGNORECASE,
)
_TITLE_SPLIT = re.compile(r"\s+(?:is|are)\s+", re.IGNORECASE)
_EDGE_PUNCT = re.compile(r"[.:;,!?]+$")


def _sentences(source: str) -> list[str]:
    parts = _SENTENCE_SPLIT.split((source or "").strip())
    return [part for part in parts if part]


def _pick_fact(source: str) -> tuple[str, str]:
    """A sentence that contains a number, and the answer to hide in the quiz."""
    sentences = _sentences(source)
    for sentence in sentences:
        match = _NUMBER.search(sentence)
        if match:
            return sentence, match.group(0)
    for sentence in sentences:
        match = _NUMBER_WORD.search(sentence)
        if match:
            return sentence, match.group(0)
    longest = max(sentences, key=len) if sentences else (source or "")
    tokens = [re.sub(r"[^\w-]", "", token) for token in longest.split()]
    tokens = [token for token in tokens if token]
    answer = max(tokens, key=len) if tokens else longest
    return longest, answer


def draft_lesson(source: str, feedback, attempt: int, flaw: bool) -> dict:
    """Return one lesson. ``feedback`` is a list of issue sentences, or None."""
    sentences = _sentences(source)
    first = sentences[0] if sentences else (source or "").strip()
    fact_sentence, answer = _pick_fact(source)
    title_head = _TITLE_SPLIT.split(first, maxsplit=1)[0]
    title = " ".join(_EDGE_PUNCT.sub("", title_head).split()[:8]) or "Micro-lesson"
    summary = first
    quote = fact_sentence
    # FR-8: only the first draft is flawed, so a retry can come back clean.
    if flaw and attempt == 1:
        quote = _EDGE_PUNCT.sub("", quote) + " or so."
        summary = first + " Most teams do it in the morning."
    question = "Complete the statement: " + fact_sentence.replace(answer, "____", 1)
    # ``feedback`` is accepted so the loop can pass the Reviewer's issues through.
    # This stub rewrites from the source on the next attempt instead of editing in place.
    _ = feedback
    return {
        "title": title,
        "summary": summary,
        "quiz": {"question": question, "answer": answer},
        "source_quote": quote,
    }
