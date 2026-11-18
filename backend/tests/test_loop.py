"""FR-4 loop, FR-5 trace, FR-8 flaw switch, and the 8 eval sources."""

import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.loop import load_eval, run_eval, run_loop
from app.main import app
from app.reviewer import review_lesson
from app.sample_text import SAMPLE_TEXT

ROOT = Path(__file__).resolve().parents[2]
EVAL = json.loads((ROOT / "05-Eval-set" / "eval-set.json").read_text(encoding="utf-8"))
client = TestClient(app)


def _bad_drafter(source, feedback, attempt, flaw):
    return {
        "title": "Broken",
        "summary": "A lesson that invents a morning routine for nobody.",
        "quiz": {"question": "What is the best day?", "answer": "Monday"},
        "source_quote": "This sentence is not in the source.",
    }


def test_clean_run_approves_on_the_first_attempt(tmp_path):
    result = run_loop(SAMPLE_TEXT, flaw=False, retries=1, trace_dir=tmp_path)
    assert result["status"] == "approved"
    assert len(result["attempts"]) == 1
    assert result["attempts"][0]["review"]["verdict"] == "approve"
    assert result["lesson"]["quiz"]["answer"] == "15"
    assert "____" in result["lesson"]["quiz"]["question"]
    saved = Path(result["trace_file"]).read_text(encoding="utf-8").strip()
    assert saved == result["trace_text"]
    agents = [line["agent"] for line in result["trace"]]
    assert agents[0] == "Orchestrator"
    assert "Drafter" in agents and "Reviewer" in agents
    for line in result["trace"]:
        assert line["t"].endswith("s")
        assert line["action"] and line["result"] and line["text"]


def test_flawed_first_draft_is_sent_back_and_then_approved(tmp_path):
    result = run_loop(SAMPLE_TEXT, flaw=True, retries=1, trace_dir=tmp_path)
    assert result["status"] == "approved"
    assert [item["n"] for item in result["attempts"]] == [1, 2]
    assert result["attempts"][0]["review"]["verdict"] == "revise"
    assert result["attempts"][1]["review"]["verdict"] == "approve"
    assert " or so." in result["attempts"][0]["draft"]["source_quote"]
    assert " or so." not in result["lesson"]["source_quote"]
    joined = result["trace_text"]
    assert "Sent 2 issues back to the Drafter." in joined or "Sent 1 issue back to the Drafter." in joined
    assert "Approved by the Reviewer. Stopping." in joined
    assert "Flawed first draft on" in joined


def test_retry_limit_marks_the_lesson_as_needs_a_person(tmp_path):
    result = run_loop(SAMPLE_TEXT, flaw=True, retries=0, trace_dir=tmp_path)
    assert result["status"] == "needs-person"
    assert len(result["attempts"]) == 1
    assert "Retry limit reached. A person needs to decide." in result["trace_text"]
    assert result["lesson"]["title"]


def test_loop_uses_every_retry_when_the_drafter_stays_wrong(tmp_path):
    result = run_loop(
        SAMPLE_TEXT,
        flaw=False,
        retries=2,
        drafter=_bad_drafter,
        trace_dir=tmp_path,
        write_file=True,
    )
    assert result["status"] == "needs-person"
    assert len(result["attempts"]) == 3
    assert result["trace_text"].count("wrote a lesson") == 3


def test_retries_outside_zero_to_two_are_rejected():
    try:
        run_loop(SAMPLE_TEXT, retries=3, write_file=False)
    except ValueError as exc:
        assert "0, 1 or 2" in str(exc)
    else:
        raise AssertionError("retries=3 should be rejected")


def test_eval_sources_pass_clean_and_recover_from_a_flawed_draft(tmp_path):
    clean = run_eval(flaw=False, retries=1, trace_dir=tmp_path)
    assert clean["total"] == 8
    assert clean["approved_first"] == 8
    assert clean["needs_person"] == 0

    flawed = run_eval(flaw=True, retries=1, trace_dir=tmp_path)
    assert flawed["approved_first"] == 0
    assert flawed["approved_after_retry"] == 8
    assert flawed["needs_person"] == 0

    stuck = run_eval(flaw=True, retries=0, trace_dir=tmp_path)
    assert stuck["needs_person"] == 8


def test_stub_reviewer_matches_the_labelled_lessons():
    sources = {item["id"]: item["text"] for item in EVAL["sources"]}
    correct = caught = 0
    good_sent_back = 0
    for row in EVAL["labelled_lessons"]:
        verdict = review_lesson(sources[row["source_id"]], row["lesson"])["verdict"]
        if verdict == row["label"]:
            correct += 1
        if row["label"] == "approve" and verdict == "revise":
            good_sent_back += 1
        if row["label"] == "revise" and verdict == "revise":
            caught += 1
    assert correct >= 39  # proposed target: at least 80% of 48
    assert good_sent_back <= 2
    assert caught >= 20


def test_api_run_flaw_and_short_text(tmp_path, monkeypatch):
    monkeypatch.setenv("AGENT_TRACE_DIR", str(tmp_path))
    short = client.post("/api/run", json={"source": "too short", "flaw": True, "retries": 1})
    assert short.status_code == 400
    assert "50" in short.json()["detail"]

    bad_retries = client.post("/api/run", json={"source": SAMPLE_TEXT, "flaw": False, "retries": 4})
    assert bad_retries.status_code == 400

    ok = client.post("/api/run", json={"source": SAMPLE_TEXT, "flaw": True, "retries": 1})
    assert ok.status_code == 200
    body = ok.json()
    assert body["status"] == "approved"
    assert body["lesson"]["quiz"]["question"].count("____") == 1
    copied = client.get(f"/api/runs/{body['id']}/trace")
    assert copied.status_code == 200
    assert "Orchestrator" in copied.text
    assert client.get("/api/runs/not-a-run").status_code == 404
    assert client.get("/health").json()["ok"] is True


def test_api_eval(tmp_path, monkeypatch):
    monkeypatch.setenv("AGENT_TRACE_DIR", str(tmp_path))
    response = client.post("/api/eval", json={"flaw": False, "retries": 1})
    assert response.status_code == 200
    body = response.json()
    assert body["approved_first"] == 8
    assert load_eval()["sources"][0]["id"] == "src-01"
