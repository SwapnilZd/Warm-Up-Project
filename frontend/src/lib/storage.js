// Settings, the current lesson and the library survive a reload (PRD FR-9).
// Everything stays in this browser. Every access is wrapped because storage can be
// blocked, full, or unavailable (private windows, disabled site data).

export const STORAGE_KEY = 'warm-up-pack-review-v1';

export const DEFAULT_STATE = Object.freeze({
  source: '',
  current: null, // { id, lesson } while a lesson waits for review
  library: [], // [{ lesson, approvedAt }]
  rejected: [], // [{ title, reason, rejectedAt }]
});

/** Returns the stored state, with bad or missing parts replaced by defaults. */
export function readStoredState(storage, defaults = DEFAULT_STATE) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...defaults };
    return {
      source: typeof parsed.source === 'string' ? parsed.source : defaults.source,
      current: isCurrent(parsed.current) ? parsed.current : null,
      library: Array.isArray(parsed.library) ? parsed.library.filter(isLibraryItem) : [],
      rejected: Array.isArray(parsed.rejected) ? parsed.rejected.filter(isRejectedItem) : [],
    };
  } catch {
    return { ...defaults };
  }
}

/** Returns true if the state was saved. */
export function writeStoredState(storage, state) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function isCurrent(c) {
  return !!c && typeof c.id === 'string' && isLesson(c.lesson);
}
function isLibraryItem(i) {
  return !!i && isLesson(i.lesson) && typeof i.approvedAt === 'string';
}
function isRejectedItem(i) {
  return !!i && typeof i.title === 'string' && typeof i.reason === 'string' && typeof i.rejectedAt === 'string';
}
function isLesson(l) {
  return (
    !!l &&
    typeof l.title === 'string' &&
    typeof l.summary === 'string' &&
    !!l.quiz &&
    typeof l.quiz.question === 'string' &&
    typeof l.quiz.answer === 'string' &&
    typeof l.source_quote === 'string'
  );
}
