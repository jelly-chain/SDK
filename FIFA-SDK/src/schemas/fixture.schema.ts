import { Fixture } from '../types.js';

/** Schema helpers for validating and describing Fixture objects. */
export const FixtureSchema = {
  validate(obj: unknown): obj is Fixture {
    if (typeof obj !== 'object' || obj === null) return false;
    const f = obj as Record<string, unknown>;
    return (
      typeof f['id'] === 'string' &&
      typeof f['tournamentId'] === 'string' &&
      typeof f['homeTeamId'] === 'string' &&
      typeof f['awayTeamId'] === 'string' &&
      typeof f['kickoffUtc'] === 'string'
    );
  },

  example(): Fixture {
    return {
      id: 'wc26-match-001',
      tournamentId: 'fifa-wc-2026',
      stage: 'group',
      groupCode: 'A',
      homeTeamId: 'team-argentina',
      awayTeamId: 'team-brazil',
      venueId: 'venue-sofi-stadium',
      kickoffUtc: '2026-06-14T18:00:00Z',
      status: 'scheduled',
    };
  },
};
