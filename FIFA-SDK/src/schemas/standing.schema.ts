import { GroupStanding } from '../types.js';

export const StandingSchema = {
  validate(obj: unknown): obj is GroupStanding {
    if (typeof obj !== 'object' || obj === null) return false;
    const s = obj as Record<string, unknown>;
    return typeof s['teamId'] === 'string' && typeof s['points'] === 'number';
  },

  example(): GroupStanding {
    return {
      teamId: 'team-argentina',
      groupCode: 'A',
      played: 3,
      won: 3,
      drawn: 0,
      lost: 0,
      goalsFor: 9,
      goalsAgainst: 2,
      goalDifference: 7,
      points: 9,
      position: 1,
    };
  },
};
