/** Deterministic normalized ID builders for all SDK entities. */

export const Ids = {
  tournament: (year: number) => `fifa-wc-${year}`,
  group: (year: number, code: string) => `wc${String(year).slice(2)}-group-${code.toLowerCase()}`,
  fixture: (year: number, matchNumber: number) =>
    `wc${String(year).slice(2)}-match-${String(matchNumber).padStart(3, '0')}`,
  team: (name: string) =>
    `team-${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
  player: (name: string) =>
    `player-${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
  venue: (name: string) =>
    `venue-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
};
