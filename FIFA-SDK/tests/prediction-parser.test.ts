import { describe, it, expect } from 'vitest';
import { MarketQuestionParser } from '../src/prediction/market-question-parser.js';

describe('MarketQuestionParser', () => {
  const parser = new MarketQuestionParser();

  it('detects TOURNAMENT_WINNER', () => {
    const r = parser.parse('Will Germany win the World Cup?');
    expect(r.marketType).toBe('TOURNAMENT_WINNER');
  });

  it('detects GROUP_WINNER', () => {
    const r = parser.parse('Will England win Group C?');
    expect(r.marketType).toBe('GROUP_WINNER');
    expect(r.extractedGroup).toBe('wc26-group-c');
  });

  it('detects QUALIFICATION', () => {
    const r = parser.parse('Will Mexico qualify from the group stage?');
    expect(r.marketType).toBe('QUALIFICATION');
  });

  it('detects REACH_QF', () => {
    const r = parser.parse('Will France reach the quarterfinals?');
    expect(r.marketType).toBe('REACH_QF');
  });

  it('extracts team from question', () => {
    const r = parser.parse('Will Brazil win Group G?');
    expect(r.extractedTeams).toContain('team-brazil');
  });

  it('handles unknown team gracefully', () => {
    const r = parser.parse('Will the host country win?');
    expect(r.extractedTeams).toEqual([]);
    expect(r.confidence).toBeLessThan(0.8);
  });

  it('defaults to FIFA_WC_2026 tournament', () => {
    const r = parser.parse('Who will win?');
    expect(r.extractedTournament).toBe('fifa-wc-2026');
  });
});
