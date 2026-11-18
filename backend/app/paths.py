"""Folders the agent loop reads and writes."""

import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
EVAL_PATH = PROJECT_ROOT / "05-Eval-set" / "eval-set.json"
DEFAULT_TRACE_DIR = BACKEND_ROOT / "traces"


def trace_directory() -> Path:
    """Where trace files are saved. Tests can point this at a temp folder."""
    raw = os.environ.get("AGENT_TRACE_DIR")
    path = Path(raw) if raw else DEFAULT_TRACE_DIR
    path.mkdir(parents=True, exist_ok=True)
    return path
