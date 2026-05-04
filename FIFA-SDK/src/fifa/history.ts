import { MemoryCache } from '../cache/memory-cache.js';

export interface HistoricalWorldCup {
  year: number;
  host: string;
  winner: string;
  runnerUp: string;
  thirdPlace: string;
  totalGoals: number;
  totalMatches: number;
  topScorer?: { playerName: string; goals: number };
}

export interface HeadToHead {
  teamA: string;
  teamB: string;
  worldCupOnly: boolean;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  teamAGoals: number;
  teamBGoals: number;
}

/** Provides historical World Cup data for backtesting and context. */
export class HistoryModule {
  constructor(private readonly cache: MemoryCache) {}

  /** Get summary data for a specific World Cup year. */
  async worldCup(year: number): Promise<HistoricalWorldCup | undefined> {
    const cacheKey = `history:wc:${year}`;
    return this.cache.get<HistoricalWorldCup>(cacheKey) ?? undefined;
  }

  /** Get head-to-head record between two teams in World Cup matches. */
  async headToHead(teamIdA: string, teamIdB: string): Promise<HeadToHead> {
    const cacheKey = `history:h2h:${[teamIdA, teamIdB].sort().join('-')}`;
    return (
      this.cache.get<HeadToHead>(cacheKey) ?? {
        teamA: teamIdA,
        teamB: teamIdB,
        worldCupOnly: true,
        teamAWins: 0,
        teamBWins: 0,
        draws: 0,
        teamAGoals: 0,
        teamBGoals: 0,
      }
    );
  }

  /** Get all countries that have won the World Cup and how many times. */
  async titleCounts(): Promise<Record<string, number>> {
    return {};
  }
}
