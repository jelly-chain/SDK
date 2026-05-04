import { Fixture, MatchStage } from '../types.js';

/** Normalizes fixture data from any provider into the SDK's Fixture type. */
export class FixtureNormalizer {
  normalize(raw: Record<string, unknown>, source: string): Fixture {
    return {
      id: String(raw['id'] ?? raw['matchId'] ?? ''),
      tournamentId: 'fifa-wc-2026',
      stage: this.normalizeStage(String(raw['stage'] ?? raw['round'] ?? 'group')),
      homeTeamId: String(raw['homeTeamId'] ?? raw['home'] ?? ''),
      awayTeamId: String(raw['awayTeamId'] ?? raw['away'] ?? ''),
      venueId: String(raw['venueId'] ?? raw['venue'] ?? ''),
      kickoffUtc: String(raw['kickoffUtc'] ?? raw['date'] ?? new Date().toISOString()),
      status: this.normalizeStatus(String(raw['status'] ?? 'scheduled')),
      homeScore: raw['homeScore'] as number | undefined,
      awayScore: raw['awayScore'] as number | undefined,
    };
  }

  private normalizeStage(raw: string): MatchStage {
    const lower = raw.toLowerCase();
    if (lower.includes('group')) return 'group';
    if (lower.includes('round of 16') || lower.includes('r16')) return 'round-of-16';
    if (lower.includes('quarter')) return 'quarterfinal';
    if (lower.includes('semi')) return 'semifinal';
    if (lower.includes('final')) return 'final';
    if (lower.includes('third')) return 'third-place';
    return 'group';
  }

  private normalizeStatus(raw: string): Fixture['status'] {
    const lower = raw.toLowerCase();
    if (['ft', 'aet', 'pen', 'finished', 'complete'].some(s => lower.includes(s))) return 'finished';
    if (['live', 'in progress', '1h', '2h', 'ht'].some(s => lower.includes(s))) return 'live';
    if (['postponed', 'cancelled', 'susp'].some(s => lower.includes(s))) return 'postponed';
    return 'scheduled';
  }
}
