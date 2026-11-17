/** Short date and time for the library, for example "12 Nov, 14:05". */
export function stamp(date = new Date()) {
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
