/** String normalization utilities for team and player names. */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function normalizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function buildTeamId(name: string): string {
  return `team-${slugify(name)}`;
}

export function buildPlayerId(name: string): string {
  return `player-${slugify(name)}`;
}

export function buildFixtureId(tournamentYear: number, matchNumber: number): string {
  return `wc${String(tournamentYear).slice(2)}-match-${String(matchNumber).padStart(3, '0')}`;
}

export function buildGroupId(year: number, groupCode: string): string {
  return `wc${String(year).slice(2)}-group-${groupCode.toLowerCase()}`;
}
