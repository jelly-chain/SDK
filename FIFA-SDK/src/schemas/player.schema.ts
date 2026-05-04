import { Player } from '../types.js';

export const PlayerSchema = {
  validate(obj: unknown): obj is Player {
    if (typeof obj !== 'object' || obj === null) return false;
    const p = obj as Record<string, unknown>;
    return typeof p['id'] === 'string' && typeof p['name'] === 'string' && typeof p['teamId'] === 'string';
  },

  example(): Player {
    return {
      id: 'player-lionel-messi',
      name: 'Lionel Messi',
      teamId: 'team-argentina',
      position: 'FWD',
      age: 38,
      caps: 191,
      goals: 109,
      available: true,
    };
  },
};
