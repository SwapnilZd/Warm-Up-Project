# Agent loop and trace (Swapnil Zende)

Track 3 of the warm-up pack. This folder is the FastAPI backend for the
draft-and-review loop. The Drafter and the Reviewer here are stubs, so the
loop can run before tracks 1 and 2 are merged. Swap them by replacing
`draft_lesson` in `app/drafter.py` and `review_lesson` in `app/reviewer.py`.
The loop only needs the lesson contract and `{ "verdict", "issues" }`.

| ID | What it does | Where |
| --- | --- | --- |
| FR-4 | If the Reviewer says revise, the Drafter is called again with those issues, up to 0, 1 or 2 retries. The loop stops on approve. At the limit it marks the lesson `needs-person`. | `app/loop.py` |
| FR-5 | Every step is logged with a time, the agent, the action and the result. The trace is on the page and can be copied. A copy is also written under `traces/`. | `app/loop.py`, `app/static/index.html` |
| FR-8 | A switch makes the first draft flawed on purpose. It is on by default for the sample text. Later attempts are clean, so one retry is enough to watch the catch. | `app/drafter.py`, the checkbox on the page |

Level 1 is the loop with one retry. Level 2 is configurable retries, the trace file, the flaw switch, and a run over the 8 eval sources (`POST /api/eval`).

## Run it

Python 3.9 or later.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Open http://127.0.0.1:8000

Load the sample (it is filled in for you), leave **Make the first draft flawed on purpose** ticked, and press **Run the agents**. Attempt 1 comes back `revise`. The Orchestrator sends the issues to the Drafter. Attempt 2 is `approve`. Copy trace copies the log. The same text is in `backend/traces/`.

Turn the flaw switch off to see a lesson approved on the first attempt. Set retries to 0 with the flaw on to see **Needs a person**.

**Run the 8 eval sources** counts how many lessons are approved first time, after a retry, or still need a person.

```bash
pytest
```

## API

`POST /api/run`

```json
{ "source": "...", "flaw": true, "retries": 1 }
```

Returns `status` (`approved` or `needs-person`), the lesson contract, each attempt, and `trace` / `trace_text`.

`POST /api/eval` with `{ "flaw": false, "retries": 1 }` runs all 8 sources.

`GET /api/runs/{id}/trace` returns the trace as plain text.

The React review screen in `frontend/` still uses its own offline stub (`src/services/agents.js`) so that screen keeps working with no server. Point that function at `POST /api/run` when the tracks are joined. The screen only needs the `lesson` object.
