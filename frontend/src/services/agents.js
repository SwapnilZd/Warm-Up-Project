// STUB. The real Drafter and Reviewer loop is the FastAPI service in /backend
// (Swapnil Zende, FR-4, FR-5, FR-8): POST http://127.0.0.1:8000/api/run
// { source, flaw, retries } -> { lesson, status, trace }.
// This file still returns the sample lesson so the review screen works with no
// server. Replace the body with that call when the tracks are joined; the screen
// only needs `{ lesson }` in the lesson contract shape.
import { SAMPLE_LESSON } from '../data/sample';

const STUB_DELAY_MS = 200; // keeps the "running" state visible

export function runAgents() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ lesson: structuredClone(SAMPLE_LESSON) }), STUB_DELAY_MS);
  });
}
