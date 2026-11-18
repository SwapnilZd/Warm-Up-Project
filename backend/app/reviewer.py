"""Stub Reviewer (stands in for track 2, FR-3, until that agent is merged).

Given a source and a lesson, returns ``approve`` or ``revise`` plus plain-language
issues. The five checks are the ones in the eval set: contract, exact quote,
answer in the quote, summary grounded in the source, and question grounded in
the quote. The loop only depends on ``verdict`` and ``issues``.
"""

import re

STOP = set(
    "the a an and or of to in on for with it is are be as at by that this they "
    "them their what will each every does did was were from about also into than "
    "then there when where which who whom whose your you our out off over any all "
    "not but can has have had its per one".split()
)
_WORD = re.compile(r"[a-z0-9]+(?:[-'][a-z0-9]+)*")
_SPACE = re.compile(r"\s+")
_PROMPT = re.compile(r"^complete the statement:\s*", re.IGNORECASE)


def _norm(text) -> str:
    return _SPACE.sub(" ", str(text or "")).strip().lower()


def _words(text) -> list[str]:
    return _WORD.findall(str(text or "").lower())


def review_lesson(source: str, lesson) -> dict:
    lesson = lesson if isinstance(lesson, dict) else {}
    quiz = lesson.get("quiz") if isinstance(lesson.get("quiz"), dict) else {}
    title = lesson.get("title")
    summary = lesson.get("summary")
    quote = lesson.get("source_quote")
    question = quiz.get("question")
    answer = quiz.get("answer")

    checks = []

    contract_ok = (
        isinstance(title, str)
        and title.strip() != ""
        and isinstance(summary, str)
        and summary.strip() != ""
        and isinstance(quote, str)
        and quote.strip() != ""
        and isinstance(question, str)
        and "____" in question
        and isinstance(answer, str)
        and answer.strip() != ""
    )
    checks.append(
        {
            "id": "contract",
            "label": "Lesson has every field and the question has a blank",
            "pass": contract_ok,
            "issue": "The lesson is missing a field, or the question has no blank (____).",
        }
    )

    quote_ok = isinstance(quote, str) and quote.strip() != "" and _norm(quote) in _norm(source)
    checks.append(
        {
            "id": "quote",
            "label": "Source quote is an exact piece of the source",
            "pass": quote_ok,
            "issue": "The source quote is not an exact piece of the source text.",
        }
    )

    answer_ok = (
        isinstance(answer, str)
        and answer.strip() != ""
        and isinstance(quote, str)
        and _norm(answer) in _norm(quote)
    )
    checks.append(
        {
            "id": "answer",
            "label": "Quiz answer appears in the source quote",
            "pass": answer_ok,
            "issue": "The quiz answer does not appear in the source quote.",
        }
    )

    source_words = set(_words(source))
    summary_text = summary if isinstance(summary, str) else ""
    content = [word for word in _words(summary_text) if len(word) > 3 and word not in STOP]
    unsupported = [word for word in content if word not in source_words]
    summary_ok = len(content) == 0 or (len(unsupported) / len(content)) <= 0.2
    shown = ", ".join(unsupported[:4])
    checks.append(
        {
            "id": "summary",
            "label": "Summary uses only words from the source",
            "pass": summary_ok,
            "issue": f"The summary uses words that are not in the source: {shown}.",
        }
    )

    question_text = question if isinstance(question, str) else ""
    question_body = _PROMPT.sub("", _norm(question_text)).replace("____", "")
    question_words = _words(question_body)
    quote_words = set(_words(quote if isinstance(quote, str) else ""))
    hits = sum(1 for word in question_words if word in quote_words)
    question_ok = len(question_words) > 0 and (hits / len(question_words)) >= 0.8
    checks.append(
        {
            "id": "question",
            "label": "Quiz question matches the source quote",
            "pass": question_ok,
            "issue": "The quiz question does not match the source quote.",
        }
    )

    issues = [check["issue"] for check in checks if not check["pass"]]
    return {
        "verdict": "revise" if issues else "approve",
        "issues": issues,
        "checks": checks,
    }
