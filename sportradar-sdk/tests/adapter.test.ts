import { describe, it, expect } from 'vitest';
import { SportradarAdapter } from '../src/adapter.js';
import type { SportradarMatch, SportradarCompetitor } from '../src/types.js';

describe('SportradarAdapter', () => {
  const adapter = new SportradarAdapter();

  const mockCompetitor: SportradarCompetitor = {
    id: 'sr:competitor:1',
    name: 'Arsenal',
    short_name: 'ARS',
    country: 'England',
    country_code: 'GBR',
    abbreviation: 'ARS',
    gender: 'male',
  };

  const mockMatch: SportradarMatch = {
    id: 'sr:sport_event:123',
    sport_id: 'sr:sport:1',
    tournament_id: 'sr:tournament:17',
    season_id: 'sr:season:12345',
    stage: 'league',
    status: 'finished',
    scheduled: '2025-05-30T15:00:00Z',
    home: mockCompetitor,
    away: { ...mockCompetitor, id: 'sr:competitor:2', name: 'Chelsea', short_name: 'CHE', abbreviation: 'CHE' },
    home_score: 2,
    away_score: 1,
  };

  it('should normalize a team', () => {
    const team = adapter.normalizeTeam(mockCompetitor);
    expect(team.id).toBe('sr:competitor:1');
    expect(team.name).toBe('Arsenal');
    expect(team.shortName).toBe('ARS');
  });

  it('should normalize a match', () => {
    const match = adapter.normalizeMatch(mockMatch);
    expect(match.id).toBe('sr:sport_event:123');
    expect(match.homeTeam.name).toBe('Arsenal');
    expect(match.awayTeam.name).toBe('Chelsea');
    expect(match.homeScore).toBe(2);
    expect(match.awayScore).toBe(1);
    expect(match.status).toBe('finished');
  });

  it('should extract result for backtesting', () => {
    const result = adapter.extractResult(mockMatch);
    expect(result).not.toBeNull();
    expect(result!.winner).toBe('sr:competitor:1');
    expect(result!.isDraw).toBe(false);
    expect(result!.homeScore).toBe(2);
  });

  it('should extract form from matches', () => {
    const matches = [
      { ...mockMatch, home_score: 2, away_score: 0 },
      { ...mockMatch, id: '2', home_score: 1, away_score: 1 },
      { ...mockMatch, id: '3', home_score: 0, away_score: 1 },
    ];
    const form = adapter.extractForm('sr:competitor:1', matches);
    expect(form).toEqual(['W', 'D', 'L']);
  });

  it('should return null for unfinished match result', () => {
    const unfinished = { ...mockMatch, status: 'live' as const, home_score: undefined };
    const result = adapter.extractResult(unfinished);
    expect(result).toBeNull();
  });
});
