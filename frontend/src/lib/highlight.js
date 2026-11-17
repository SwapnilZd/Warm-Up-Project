// Splits the source into plain and highlighted pieces so the quote can be shown
// with React elements. No HTML strings are built, so source text is never injected as markup.

/**
 * Returns { found, segments } where segments is [{ text, marked }] covering the whole
 * source. `marked` is true for the part that is an exact copy of the quote. If the quote
 * is not an exact piece of the source, nothing is marked and `found` is false.
 */
export function segmentsAroundQuote(source, quote) {
  const needle = String(quote ?? '').trim();
  const start = needle ? source.indexOf(needle) : -1;
  if (start === -1) {
    return { found: false, segments: [{ text: source, marked: false }] };
  }
  const segments = [];
  if (start > 0) segments.push({ text: source.slice(0, start), marked: false });
  segments.push({ text: needle, marked: true });
  const end = start + needle.length;
  if (end < source.length) segments.push({ text: source.slice(end), marked: false });
  return { found: true, segments };
}
