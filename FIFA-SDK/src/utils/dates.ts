/** Date and time utilities for World Cup scheduling. */

export function parseKickoff(isoString: string): Date {
  return new Date(isoString);
}

export function minutesUntilKickoff(isoString: string): number {
  return Math.floor((new Date(isoString).getTime() - Date.now()) / 60000);
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.abs(a - b) / 86400000;
}

export function isMatchLive(kickoffUtc: string, durationMinutes = 105): boolean {
  const kickoff = new Date(kickoffUtc).getTime();
  const now = Date.now();
  const endEstimate = kickoff + durationMinutes * 60000;
  return now >= kickoff && now <= endEstimate;
}

export function formatMatchDate(isoString: string): string {
  return new Date(isoString).toUTCString();
}
