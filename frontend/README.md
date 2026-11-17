# Warm-up pack review screen (frontend)

The human review screen for the Warm-up pack. It is track 4 of the
[PRD](../02-PRD.docx) and covers these requirements:

| ID | What it covers | Where |
| --- | --- | --- |
| FR-1 | Source input: 50 to 3,000 characters, live count, a reason when Run is off, one-click sample | `src/components/SourceInput.jsx`, `src/lib/sourceText.js` |
| FR-6 | Human review: source beside the lesson, quote highlighted, edit, check again, approve, reject with a reason | `src/components/ReviewScreen.jsx`, `src/lib/highlight.js` |
| FR-7 | Library: approved lessons, copy as JSON, remove | `src/components/Library.jsx` |
| FR-9 | Local storage: source, current lesson and library survive a reload. Nothing leaves the browser | `src/lib/storage.js` |
| FR-10 | Accessibility: labels, keyboard use, status announcements, WCAG AA contrast | throughout |

The agents (FR-2, FR-3, FR-4, FR-5) and the flaw switch (FR-8) belong to other tracks. This folder
only has stand-ins for them, described below.

## Run it

Requires Node 22.12 or later.

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm test         # unit and screen tests (Vitest + Testing Library)
npm run lint
npm run build    # production build in dist/
```

## Where the other tracks plug in

Both files are stand-ins. The review screen only depends on the shapes they return.

- `src/services/agents.js`: `runAgents(source)` returns `{ lesson }` in the lesson contract shape.
  It currently returns the sample lesson for any text. Replace the body with a call to the agent loop (track 3).
- `src/services/reviewer.js`: `reviewLesson(source, lesson)` returns `{ verdict, issues }`. It runs
  two plain-code checks from FR-3 (exact quote, answer in quote) so that Check again has something to show.
  Replace it with the Reviewer agent (track 2) when that is merged.

The lesson contract lives in `src/lib/lessonContract.js`. Copied JSON contains only the contract keys,
in contract order, so it matches the eval set.

## Decisions worth knowing

- **Separate folder in the same repo.** This keeps the React build apart from the prototype and the
  Word files. The branch is `feature/review-screen-ui`.
- **Quote matching is exact.** FR-3 says "an exact piece of the source", so the highlight uses an exact,
  case-sensitive match. The prototype matched more loosely.
- **Length counts trimmed characters.** Spaces at the ends do not count toward the 50-character minimum.
- **Run is `aria-disabled`, not `disabled`.** Keyboard users can still reach it and hear why it is off.
- **Storage key `warm-up-pack-review-v1`** is separate from the prototype's key, because the shapes differ.
- **Vitest runs with `pool: 'vmForks'`.** The default worker pool did not start on the development machine
  (Node 26). If your machine runs fine without it, you can remove that line from `vite.config.js`.

## Not in this folder

- The public-text notice (FR-11) and the flaw switch (FR-8) are on the source screen in the prototype.
  They are not assigned to this track, so they are not built here.
- The prototype's Agents and Trace screen is track 3's work.
