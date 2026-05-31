import { Team } from '../types.js';

export const TeamSchema = {
  validate(obj: unknown): obj is Team {
    if (typeof obj !== 'object' || obj === null) return false;
    const t = obj as Record<string, unknown>;
    return typeof t['id'] === 'string' && typeof t['name'] === 'string';
  },

  example(): Team {
    return {
      id: 'team-argentina',
      name: 'Argentina',
      shortName: 'ARG',
      countryCode: 'ARG',
      fifaRanking: 1,
      confederation: 'CONMEBOL',
    };
  },
};
