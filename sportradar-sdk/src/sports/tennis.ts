/**
 * Tennis-specific Sportradar integration
 * Grand Slams, ATP, WTA with player tracking and surface analysis
 */

import { SportradarClient } from '../client.js';
import type { SportradarMatch, SportradarPlayer, SportradarStanding } from '../types.js';

export interface TennisMatch extends SportradarMatch {
  surface: 'hard' | 'clay' | 'grass' | 'carpet';
  round: string; // e.g. "Final", "Semifinal", "Quarterfinal", "Round of 16"
  bestOf: number; // 3 or 5
  sets: Array<{ home: number; away: number; tiebreak?: { home: number; away: number } }>;
}

export interface TennisPlayer {
  id: string;
  name: string;
  nationality: string;
  ranking: number;
  points: number;
  age: number;
  height: number; // cm
  weight: number; // kg
  plays: 'right-handed' | 'left-handed';
  backhand: 'one-handed' | 'two-handed';
  titles: number;
  winLoss: { wins: number; losses: number };
  surfaceStats: {
    hard: { wins: number; losses: number; winRate: number };
    clay: { wins: number; losses: number; winRate: number };
    grass: { wins: number; losses: number; winRate: number };
  };
}

export interface TournamentDraw {
  tournamentId: string;
  tournamentName: string;
  surface: string;
  rounds: DrawRound[];
}

export interface DrawRound {
  name: string; // "Final", "Semifinal", etc.
  matches: Array<{
    matchId: string;
    player1: { id: string; name: string; seed?: number };
    player2: { id: string; name: string; seed?: number };
    winner?: string;
    score?: string;
  }>;
}

export class SportradarTennis {
  constructor(private readonly client: SportradarClient) {}

  /** Get ATP schedule */
  async getATPSchedule(seasonId?: string): Promise<TennisMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:42');
    if (!season) return [];
    return this.client.getSchedule(season) as Promise<TennisMatch[]>;
  }

  /** Get WTA schedule */
  async getWTASchedule(seasonId?: string): Promise<TennisMatch[]> {
    const season = seasonId ?? await this.getCurrentSeasonId('sr:tournament:6');
    if (!season) return [];
    return this.client.getSchedule(season) as Promise<TennisMatch[]>;
  }

  /** Get Grand Slam schedule */
  async getGrandSlamSchedule(tournament: 'australian-open' | 'french-open' | 'wimbledon' | 'us-open'): Promise<TennisMatch[]> {
    const tournamentMap = {
      'australian-open': 'sr:tournament:580',
      'french-open': 'sr:tournament:540',
      'wimbledon': 'sr:tournament:560',
      'us-open': 'sr:tournament:520',
    };
    const season = await this.getCurrentSeasonId(tournamentMap[tournament]);
    if (!season) return [];
    return this.client.getSchedule(season) as Promise<TennisMatch[]>;
  }

  /** Get live tennis matches */
  async getLiveMatches(): Promise<TennisMatch[]> {
    return this.client.getLiveMatches('sr:sport:5') as Promise<TennisMatch[]>;
  }

  /** Get player profile with surface stats */
  async getPlayerProfile(playerId: string): Promise<TennisPlayer | null> {
    // Would query Sportradar player endpoint
    return null;
  }

  /** Get tournament draw */
  async getTournamentDraw(tournamentId: string): Promise<TournamentDraw | null> {
    // Would query Sportradar draw endpoint
    return null;
  }

  /** Analyze surface matchup */
  analyzeSurfaceMatchup(
    player1: TennisPlayer,
    player2: TennisPlayer,
    surface: 'hard' | 'clay' | 'grass',
  ): {
    advantage: string;
    player1WinRate: number;
    player2WinRate: number;
    factors: string[];
  } {
    const p1Stats = player1.surfaceStats[surface];
    const p2Stats = player2.surfaceStats[surface];
    const factors: string[] = [];

    const advantage = p1Stats.winRate > p2Stats.winRate ? player1.name : player2.name;
    const diff = Math.abs(p1Stats.winRate - p2Stats.winRate);

    if (diff > 0.15) {
      factors.push(`${advantage} has significant ${surface} court advantage`);
    }
    if (player1.ranking !== player2.ranking) {
      const rankDiff = Math.abs(player1.ranking - player2.ranking);
      if (rankDiff > 10) {
        factors.push(`Ranking gap: ${rankDiff} positions`);
      }
    }

    return {
      advantage,
      player1WinRate: p1Stats.winRate,
      player2WinRate: p2Stats.winRate,
      factors,
    };
  }

  private async getCurrentSeasonId(tournamentId: string): Promise<string | undefined> {
    const season = await this.client.getCurrentSeason(tournamentId);
    return season?.id;
  }
}
