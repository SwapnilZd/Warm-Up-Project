"""FR-4 agent loop and FR-5 trace.

The Orchestrator calls the Drafter, then the Reviewer. On ``revise`` it sends the
issue sentences back and tries again, up to the retry limit (0, 1 or 2). It stops
on ``approve``. If the last attempt is still ``revise``, the lesson is marked
``needs-person``.
"""

from __future__ import annotations

import json
import time
import uuid
from datetime import datetime

from app.drafter import draft_lesson
from app.paths import EVAL_PATH, trace_directory
from app.reviewer import review_lesson


def new_run_id(prefix: str = "run") -> str:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{prefix}-{stamp}-{uuid.uuid4().hex[:6]}"


class TraceLog:
    """One line per agent step: time, agent, action, result."""

    def __init__(self):
        self._started = time.perf_counter()
        self.entries = []

    def add(self, agent: str, action: str, result: str, text: str) -> None:
        elapsed = time.perf_counter() - self._started
        self.entries.append(
            {
                "t": f"{elapsed:.3f}s",
                "agent": agent,
                "action": action,
                "result": result,
                "text": text,
            }
        )

    def as_text(self) -> str:
        return "\n".join(f"{entry['t']}  {entry['agent']}  {entry['text']}" for entry in self.entries)


def _issue_word(count: int) -> str:
    return "issue" if count == 1 else "issues"


def run_loop(
    source: str,
    *,
    flaw: bool = True,
    retries: int = 1,
    drafter=None,
    reviewer=None,
    trace_dir=None,
    run_id: str | None = None,
    write_file: bool = True,
) -> dict:
    """Run the draft-and-review loop once and return the lesson, attempts and trace."""
    if retries not in (0, 1, 2):
        raise ValueError("Maximum retries must be 0, 1 or 2.")
    drafter = drafter or draft_lesson
    reviewer = reviewer or review_lesson
    run_id = run_id or new_run_id()
    trace = TraceLog()
    attempts = []
    feedback = None
    status = "needs-person"
    draft = None

    flaw_label = "on" if flaw else "off"
    trace.add(
        "Orchestrator",
        "Started",
        f"Flawed first draft {flaw_label}, maximum retries {retries}.",
        f"Started. Flawed first draft {flaw_label}, maximum retries {retries}.",
    )

    for attempt_no in range(1, retries + 2):
        draft = drafter(source, feedback, attempt_no, flaw)
        attempts.append({"n": attempt_no, "draft": draft, "review": None})
        used = ""
        if feedback:
            used = f" Read {len(feedback)} reviewer {_issue_word(len(feedback))}."
        trace.add(
            "Drafter",
            "Wrote a lesson",
            f"Attempt {attempt_no}.{used}",
            f"Attempt {attempt_no}: wrote a lesson.",
        )

        review = reviewer(source, draft)
        attempts[-1]["review"] = review
        issue_count = len(review.get("issues") or [])
        word = _issue_word(issue_count)
        detail = f"Attempt {attempt_no}: {review.get('verdict')} ({issue_count} {word})."
        if review.get("issues"):
            detail = detail + " " + " ".join(review["issues"])
        trace.add("Reviewer", "Checked the draft", detail, f"Attempt {attempt_no}: {review.get('verdict')} ({issue_count} {word}).")

        if review.get("verdict") == "approve":
            status = "approved"
            trace.add(
                "Orchestrator",
                "Stopped",
                "Approved by the Reviewer.",
                "Approved by the Reviewer. Stopping.",
            )
            break
        if attempt_no <= retries:
            trace.add(
                "Orchestrator",
                "Sent issues back to the Drafter",
                f"{issue_count} {word}.",
                f"Sent {issue_count} {word} back to the Drafter.",
            )
            feedback = list(review.get("issues") or [])
        else:
            status = "needs-person"
            trace.add(
                "Orchestrator",
                "Stopped",
                "Retry limit reached. A person needs to decide.",
                "Retry limit reached. A person needs to decide.",
            )

    trace_text = trace.as_text()
    trace_file = ""
    if write_file:
        directory = trace_dir or trace_directory()
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / f"{run_id}.txt"
        path.write_text(trace_text + "\n", encoding="utf-8")
        trace_file = str(path)

    return {
        "id": run_id,
        "status": status,
        "lesson": draft,
        "attempts": attempts,
        "trace": trace.entries,
        "trace_text": trace_text,
        "trace_file": trace_file,
        "flaw": bool(flaw),
        "retries": retries,
    }


def load_eval() -> dict:
    if not EVAL_PATH.is_file():
        raise FileNotFoundError(f"Eval set not found at {EVAL_PATH}")
    return json.loads(EVAL_PATH.read_text(encoding="utf-8"))


def run_eval(*, flaw: bool = False, retries: int = 1, trace_dir=None, write_file: bool = True) -> dict:
    """Run every eval source through the loop and count first-pass, retry, and needs-a-person."""
    sources = load_eval()["sources"]
    rows = []
    approved_first = 0
    approved_after_retry = 0
    needs_person = 0
    blocks = [
        f"Eval run. Flawed first draft {'on' if flaw else 'off'}, maximum retries {retries}.",
        "",
    ]
    for source in sources:
        result = run_loop(source["text"], flaw=flaw, retries=retries, write_file=False)
        attempt_count = len(result["attempts"])
        if result["status"] == "approved" and attempt_count == 1:
            outcome = "approved_first"
            approved_first += 1
        elif result["status"] == "approved":
            outcome = "approved_after_retry"
            approved_after_retry += 1
        else:
            outcome = "needs_person"
            needs_person += 1
        rows.append(
            {
                "source_id": source["id"],
                "topic": source.get("topic", ""),
                "status": result["status"],
                "attempts": attempt_count,
                "outcome": outcome,
            }
        )
        blocks.append(f"{source['id']}  {outcome}  attempts={attempt_count}")
        blocks.append(result["trace_text"])
        blocks.append("")

    run_id = new_run_id("eval")
    trace_text = "\n".join(blocks).rstrip() + "\n"
    trace_file = ""
    if write_file:
        directory = trace_dir or trace_directory()
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / f"{run_id}.txt"
        path.write_text(trace_text, encoding="utf-8")
        trace_file = str(path)

    return {
        "id": run_id,
        "flaw": bool(flaw),
        "retries": retries,
        "total": len(rows),
        "approved_first": approved_first,
        "approved_after_retry": approved_after_retry,
        "needs_person": needs_person,
        "sources": rows,
        "trace_text": trace_text,
        "trace_file": trace_file,
    }
