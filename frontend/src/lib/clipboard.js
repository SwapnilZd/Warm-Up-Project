/** Copies text with the Clipboard API. Returns false when the browser does not allow it. */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or not a secure context. Fall through to the false result.
  }
  return false;
}
