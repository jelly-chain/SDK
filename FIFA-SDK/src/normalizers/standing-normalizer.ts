import { GroupStanding, GroupCode } from '../types.js';

/** Normalizes group standing data from any provider. */
export class StandingNormalizer {
  normalize(raw: Record<string, unknown>, groupCode: GroupCode): GroupStanding {
    const goalsFor = Number(raw['goalsFor'] ?? raw['goals_for'] ?? raw['gf'] ?? 0);
    const goalsAgainst = Number(raw['goalsAgainst'] ?? raw['goals_against'] ?? raw['ga'] ?? 0);

    return {
      teamId: String(raw['teamId'] ?? raw['team'] ?? ''),
      groupCode,
      played: Number(raw['played'] ?? raw['mp'] ?? 0),
      won: Number(raw['won'] ?? raw['w'] ?? 0),
      drawn: Number(raw['drawn'] ?? raw['d'] ?? 0),
      lost: Number(raw['lost'] ?? raw['l'] ?? 0),
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: Number(raw['points'] ?? raw['pts'] ?? 0),
      position: Number(raw['position'] ?? raw['rank'] ?? 0),
    };
  }
}
