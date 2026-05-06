import { describe, it, expect } from 'vitest';
import { MarketQuestionParser } from '../src/prediction/market-question-parser.js';

describe('MarketQuestionParser', () => {
  const parser = new MarketQuestionParser();

  it('detects football as default sport', () => {
    const result = parser.parse('Will Arsenal beat Chelsea?');
    expect(result.sport).toBe('football');
  });

  it('detects basketball from "NBA"', () => {
    const result = parser.parse('Will the Lakers win the NBA championship?');
    expect(result.sport).toBe('basketball');
  });

  it('detects american-football from "NFL"', () => {
    const result = parser.parse('Who wins the NFL Super Bowl?');
    expect(result.sport).toBe('american-football');
  });

  it('detects baseball from "MLB"', () => {
    const result = parser.parse('Will the Yankees win the MLB World Series?');
    expect(result.sport).toBe('baseball');
  });

  it('detects ice-hockey from "NHL"', () => {
    const result = parser.parse('Will the Oilers win the NHL Stanley Cup?');
    expect(result.sport).toBe('ice-hockey');
  });

  it('detects tennis from "Wimbledon"', () => {
    const result = parser.parse('Who wins Wimbledon?');
    expect(result.sport).toBe('tennis');
  });

  it('detects mma from "UFC"', () => {
    const result = parser.parse('Will he win the UFC title fight?');
    expect(result.sport).toBe('mma');
  });

  it('detects formula1 from "F1"', () => {
    const result = parser.parse('Will Verstappen win the F1 championship?');
    expect(result.sport).toBe('formula1');
  });

  it('detects CHAMPIONSHIP_WINNER market type', () => {
    const result = parser.parse('Will City win the league champion?');
    expect(result.marketType).toBe('CHAMPIONSHIP_WINNER');
  });

  it('detects MATCH_WINNER as default market type', () => {
    const result = parser.parse('Will Arsenal win on Sunday?');
    expect(result.marketType).toBe('MATCH_WINNER');
  });

  it('detects OVER_UNDER market type', () => {
    const result = parser.parse('Will the total goals be over 2.5?');
    expect(result.marketType).toBe('OVER_UNDER');
  });

  it('extracts team names from capitalized words', () => {
    const result = parser.parse('Will Liverpool beat Manchester City?');
    expect(result.extractedTeams.length).toBeGreaterThan(0);
  });

  it('extracts season from question', () => {
    const result = parser.parse('Will PSG win Ligue 1 in 2025/2026?');
    expect(result.extractedSeason).toBe('2025/2026');
  });

  it('returns original question in result', () => {
    const q = 'Will Nadal win the French Open?';
    const result = parser.parse(q);
    expect(result.original).toBe(q);
  });

  it('has confidence between 0 and 1', () => {
    const result = parser.parse('Who wins?');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
