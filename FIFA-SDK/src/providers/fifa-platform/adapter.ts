import { Fixture, Team, GroupStanding } from '../../types.js';

/** Adapts FIFA platform API responses to normalized SDK types. */
export class FifaPlatformAdapter {
  normalizeFixture(raw: Record<string, unknown>): Fixture {
    return {
      id: String(raw['MatchId'] ?? ''),
      tournamentId: 'fifa-wc-2026',
      stage: 'group',
      homeTeamId: String(raw['HomeTeam'] ?? ''),
      awayTeamId: String(raw['AwayTeam'] ?? ''),
      venueId: String(raw['Venue'] ?? ''),
      kickoffUtc: String(raw['Date'] ?? new Date().toISOString()),
      status: 'scheduled',
    };
  }

  normalizeTeam(raw: Record<string, unknown>): Team {
    return {
      id: `team-${String(raw['IdTeam'] ?? '').toLowerCase()}`,
      name: String(raw['Name'] ?? ''),
      shortName: String(raw['ShortName'] ?? ''),
      countryCode: String(raw['CountryCode'] ?? ''),
    };
  }

  normalizeStanding(raw: Record<string, unknown>): GroupStanding {
    return {
      teamId: String(raw['IdTeam'] ?? ''),
      groupCode: 'A',
      played: Number(raw['Played'] ?? 0),
      won: Number(raw['Won'] ?? 0),
      drawn: Number(raw['Drawn'] ?? 0),
      lost: Number(raw['Lost'] ?? 0),
      goalsFor: Number(raw['GoalsFor'] ?? 0),
      goalsAgainst: Number(raw['GoalsAgainst'] ?? 0),
      goalDifference: Number(raw['GoalDifference'] ?? 0),
      points: Number(raw['Points'] ?? 0),
      position: Number(raw['Position'] ?? 0),
    };
  }
}
