/** Parse an ISO date string safely. */
export function parseISO(dateStr: string): Date {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${dateStr}`);
  return d;
}

/** Format a date to a human-readable string. */
export function formatDate(date: Date | string, format = 'short'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  switch (format) {
    case 'short': return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'long': return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'iso': return d.toISOString().split('T')[0];
    case 'datetime': return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'time': return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    default: return d.toISOString();
  }
}

/** Format a relative time (e.g., "2 hours ago"). */
export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d, 'short');
}

/** Check if a match is currently live. */
export function isLive(status: string): boolean {
  return status === 'in_progress' || status === 'live';
}

/** Check if a match is finished. */
export function isFinished(status: string): boolean {
  return status === 'completed' || status === 'finished';
}

/** Check if a match is scheduled (not yet started). */
export function isScheduled(status: string): boolean {
  return status === 'scheduled' || status === 'upcoming';
}

/** Get the current minute of a live match (approximate). */
export function getLiveMinute(kickoff: string): number {
  const start = parseISO(kickoff);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
}

/** Check if a date falls within a range. */
export function matchDateRange(date: string, start: string, end: string): boolean {
  const d = new Date(date).getTime();
  return d >= new Date(start).getTime() && d <= new Date(end).getTime();
}

/** Get the season year for a given date. */
export function getSeasonYear(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const year = d.getFullYear();
  // World Cup years: 2018, 2022, 2026
  if (year <= 2018) return 2018;
  if (year <= 2022) return 2022;
  return 2026;
}

/** Calculate days until a match. */
export function daysUntil(date: string): number {
  const target = parseISO(date);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Get a human-readable countdown. */
export function countdown(date: string): string {
  const days = daysUntil(date);
  if (days < 0) return 'already played';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `in ${days} days`;
  if (days < 30) return `in ${Math.ceil(days / 7)} weeks`;
  return `in ${Math.ceil(days / 30)} months`;
}
