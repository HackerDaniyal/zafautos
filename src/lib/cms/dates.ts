/**
 * Formats a date as "Jul 20, 2026".
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date as "Jul 20, 2026 3:45 PM".
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date as relative time: "2 hours ago", "3 days ago", etc.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 0) return 'just now';
  if (diffSec < 60) return 'just now';
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHr === 1) return '1 hour ago';
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay === 1) return '1 day ago';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffWeek === 1) return '1 week ago';
  if (diffWeek < 4) return `${diffWeek} weeks ago`;
  if (diffMonth === 1) return '1 month ago';
  if (diffMonth < 12) return `${diffMonth} months ago`;
  if (diffYear === 1) return '1 year ago';
  return `${diffYear} years ago`;
}

/**
 * Returns true if the date is before now.
 */
export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Returns true if the date is within N days from now (default 7).
 */
export function isDueSoon(date: Date | string, days: number = 7): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const msPerDay = 1000 * 60 * 60 * 24;
  return diffMs > 0 && diffMs <= days * msPerDay;
}

/**
 * Converts a Date or string to ISO 8601 string.
 */
export function toISOString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Returns a human-readable date range string.
 * Same month: "Jul 20 - Jul 25, 2026"
 * Different months: "Jul 20, 2026 - Aug 5, 2026"
 */
export function getDateRange(start: Date | string, end: Date | string): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;

  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();

  if (sameMonth) {
    const month = s.toLocaleDateString('en-US', { month: 'short' });
    const startDay = s.getDate();
    const endDay = e.getDate();
    const year = s.getFullYear();
    return `${month} ${startDay} - ${month} ${endDay}, ${year}`;
  }

  const startStr = formatDate(s);
  const endStr = formatDate(e);
  return `${startStr} - ${endStr}`;
}
