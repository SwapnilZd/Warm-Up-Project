"""FastAPI service for the agent loop (Swapnil Zende: FR-4, FR-5, FR-8)."""

from __future__ import annotations

import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel, Field

from app.loop import run_eval, run_loop
from app.paths import BACKEND_ROOT
from app.sample_text import SAMPLE_TEXT, source_problem

STATIC_INDEX = BACKEND_ROOT / "app" / "static" / "index.html"
RUN_ID = re.compile(r"(?:run|eval)-\d{8}-\d{6}-[0-9a-f]{6}")

app = FastAPI(
    title="Micro-lesson agent loop",
    description="Track 3 (Swapnil Zende): the Drafter and Reviewer loop, the trace, and the flawed-first-draft switch.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Recent runs stay in memory so the page can reopen a trace. The file on disk remains after a restart.
RUNS: dict[str, dict] = {}


class RunRequest(BaseModel):
    source: str = ""
    flaw: bool = True
    retries: int = Field(default=1, description="How many times the Drafter may try again. 0, 1 or 2.")


class EvalRequest(BaseModel):
    flaw: bool = False
    retries: int = 1


def _check_retries(retries: int) -> None:
    if retries not in (0, 1, 2):
        raise HTTPException(status_code=400, detail="Maximum retries must be 0, 1 or 2.")


def _remember(result: dict) -> dict:
    RUNS[result["id"]] = result
    return result


@app.get("/health")
def health():
    return {"ok": True, "track": "agent-loop-and-trace", "owner": "Swapnil Zende"}


@app.get("/api/sample")
def sample():
    return {"text": SAMPLE_TEXT}


@app.post("/api/run")
def run_agents(body: RunRequest):
    """FR-4 loop, FR-5 trace, FR-8 flaw switch."""
    problem = source_problem(body.source)
    if problem:
        raise HTTPException(status_code=400, detail=problem)
    _check_retries(body.retries)
    result = run_loop(body.source, flaw=body.flaw, retries=body.retries)
    return _remember(result)


@app.post("/api/eval")
def eval_agents(body: EvalRequest):
    """Run the 8 eval sources through the loop."""
    _check_retries(body.retries)
    try:
        result = run_eval(flaw=body.flaw, retries=body.retries)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return _remember(result)


@app.get("/api/runs/{run_id}")
def get_run(run_id: str):
    if not RUN_ID.fullmatch(run_id):
        raise HTTPException(status_code=404, detail="No run with that id.")
    stored = RUNS.get(run_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="No run with that id. The trace file may still be on disk.")
    return stored


@app.get("/api/runs/{run_id}/trace", response_class=PlainTextResponse)
def get_trace(run_id: str):
    if not RUN_ID.fullmatch(run_id):
        raise HTTPException(status_code=404, detail="No trace with that id.")
    stored = RUNS.get(run_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="No trace with that id.")
    return stored["trace_text"] + ("\n" if not stored["trace_text"].endswith("\n") else "")


@app.get("/")
def index():
    if not STATIC_INDEX.is_file():
        raise HTTPException(status_code=404, detail="The agent-loop page is missing.")
    return FileResponse(STATIC_INDEX)
