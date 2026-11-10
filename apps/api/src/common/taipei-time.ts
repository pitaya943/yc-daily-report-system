/** B-078 Asia/Taipei calendar dates for validation. */
export function taipeiYmd(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
