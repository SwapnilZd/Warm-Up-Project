// Source length rules from PRD FR-1: 50 to 3,000 characters.
// Length is counted after trimming the ends, so spaces alone never count.

export const MIN_CHARS = 50;
export const MAX_CHARS = 3000;

export function countChars(text) {
  return String(text ?? '').trim().length;
}

export function formatCount(n) {
  return n.toLocaleString('en-US');
}

/** Returns { ok, count, message }. The message says why the text is not usable. */
export function sourceStatus(text) {
  const count = countChars(text);
  if (count < MIN_CHARS) {
    return {
      ok: false,
      count,
      message: `Add at least ${MIN_CHARS} characters. You have ${formatCount(count)}.`,
    };
  }
  if (count > MAX_CHARS) {
    return {
      ok: false,
      count,
      message: `Shorten the text to ${formatCount(MAX_CHARS)} characters or fewer. You have ${formatCount(count)}.`,
    };
  }
  return { ok: true, count, message: '' };
}
