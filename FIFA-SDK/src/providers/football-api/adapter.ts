import { Fixture, Team, Player } from '../../types.js';

/** Adapts api-football.com responses to normalized SDK types. */
export class FootballApiAdapter {
  normalizeFixture(raw: Record<string, unknown>): Fixture {
    const fixture = raw['fixture'] as Record<string, unknown> ?? {};
    const teams = raw['teams'] as Record<string, unknown> ?? {};
    const goals = raw['goals'] as Record<string, unknown> ?? {};
    const home = (teams['home'] as Record<string, unknown>) ?? {};
    const away = (teams['away'] as Record<string, unknown>) ?? {};

    return {
      id: `wc26-match-${String(fixture['id'] ?? '')}`,
      tournamentId: 'fifa-wc-2026',
      stage: 'group',
      homeTeamId: `team-${String(home['name'] ?? '').toLowerCase().replace(/\s+/g, '-')}`,
      awayTeamId: `team-${String(away['name'] ?? '').toLowerCase().replace(/\s+/g, '-')}`,
      venueId: String((fixture['venue'] as Record<string, unknown>)?.['id'] ?? ''),
      kickoffUtc: String(fixture['date'] ?? new Date().toISOString()),
      status: 'scheduled',
      homeScore: goals['home'] as number | undefined,
      awayScore: goals['away'] as number | undefined,
    };
  }

  normalizeTeam(raw: Record<string, unknown>): Team {
    const team = raw['team'] as Record<string, unknown> ?? raw;
    return {
      id: `team-${String(team['name'] ?? '').toLowerCase().replace(/\s+/g, '-')}`,
      name: String(team['name'] ?? ''),
      shortName: String(team['code'] ?? ''),
      countryCode: String(team['country'] ?? ''),
    };
  }

  normalizePlayer(raw: Record<string, unknown>): Player {
    const player = raw['player'] as Record<string, unknown> ?? raw;
    return {
      id: `player-${String(player['name'] ?? '').toLowerCase().replace(/\s+/g, '-')}`,
      name: String(player['name'] ?? ''),
      teamId: '',
      position: 'MID',
      age: player['age'] as number | undefined,
      available: true,
    };
  }
}
