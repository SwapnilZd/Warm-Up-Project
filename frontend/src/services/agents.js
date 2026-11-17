// STUB. The real Drafter and Reviewer loop is track 3 (agent loop and trace).
// Until it is merged, this returns the sample lesson for any text, so the review
// screen can be built and tested. Replace the body with a call to the loop; the
// screen only needs `{ lesson }` in the lesson contract shape.
import { SAMPLE_LESSON } from '../data/sample';

const STUB_DELAY_MS = 200; // keeps the "running" state visible

export function runAgents() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ lesson: structuredClone(SAMPLE_LESSON) }), STUB_DELAY_MS);
  });
}
