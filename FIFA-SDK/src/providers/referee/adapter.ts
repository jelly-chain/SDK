import { RefereeProfile, RefereeAssignment } from './client.js';
import type { RawReferee, RawAssignment } from './types.js';

/** Adapts raw referee API responses to normalized objects. */
export class RefereeAdapter {
  normalizeReferee(raw: RawReferee): RefereeProfile {
    return {
      id: raw.id,
      name: raw.name,
      nationality: raw.nationality,
      confederation: raw.confederation,
      totalMatches: raw.total_matches,
      stats: {
        avgYellowCards: raw.yellow_cards_avg,
        avgRedCards: raw.red_cards_avg,
        avgPenalties: raw.penalties_avg,
        avgFouls: raw.fouls_avg,
        avgCorners: raw.corners_avg,
        strictness: raw.strictness as RefereeProfile['stats']['strictness'],
      },
      recentForm: {
        matches: Math.min(10, raw.total_matches),
        avgCards: raw.yellow_cards_avg + raw.red_cards_avg,
        avgPenalties: raw.penalties_avg,
      },
    };
  }

  normalizeAssignment(raw: RawAssignment, referee: RefereeProfile): RefereeAssignment {
    return {
      fixtureId: raw.fixture_id,
      referee,
      assistantReferees: raw.assistants,
      fourthOfficial: raw.fourth_official,
      var: raw.var,
    };
  }
}
