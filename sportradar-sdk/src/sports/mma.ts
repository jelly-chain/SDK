/**
 * MMA/UFC-specific Sportradar integration
 * Fighter profiles, fight cards, and prediction analysis
 */

import { SportradarClient } from '../client.js';
import type { SportradarMatch } from '../types.js';

export type WeightClass =
  | 'strawweight' | 'flyweight' | 'bantamweight' | 'featherweight'
  | 'lightweight' | 'welterweight' | 'middleweight' | 'light-heavyweight'
  | 'heavyweight' | 'womens-strawweight' | 'womens-flyweight'
  | 'womens-bantamweight' | 'womens-featherweight';

export interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  nationality: string;
  weightClass: WeightClass;
  record: { wins: number; losses: number; draws: number; noContests: number };
  ranking?: number;
  champion: boolean;
  stats: {
    height: number; // cm
    reach: number; // cm
    stance: 'orthodox' | 'southpaw' | 'switch';
    sigStrikesPerMin: number;
    sigStrikeAccuracy: number;
    takedownAvg: number;
    takedownAccuracy: number;
    submissionAvg: number;
    knockdownAvg: number;
    sigStrikeDefense: number;
    takedownDefense: number;
  };
  recentForm: Array<{ opponent: string; result: string; method: string; round: number }>;
}

export interface FightCard {
  id: string;
  name: string; // e.g. "UFC 300"
  date: string;
  venue: string;
  city: string;
  country: string;
  promotion: 'UFC' | 'Bellator' | 'ONE' | 'PFL';
  fights: Fight[];
  isPPV: boolean;
}

export interface Fight {
  id: string;
  cardId: string;
  boutNumber: number;
  weightClass: WeightClass;
  isTitleFight: boolean;
  isMainEvent: boolean;
  isCoMain: boolean;
  rounds: number;
  fighter1Id: string;
  fighter2Id: string;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  result?: { winner: string; method: string; round: number; time: string };
  odds?: { fighter1: number; fighter2: number };
}

export interface FightPrediction {
  fighter1Id: string;
  fighter2Id: string;
  fighter1WinProb: number;
  fighter2WinProb: number;
  methodPrediction: { koProb: number; submissionProb: number; decisionProb: number };
  roundPrediction: { round1: number; round2: number; round3: number; round4?: number; round5?: number };
  factors: string[];
  edge: number;
  recommendation: string;
}

export class SportradarMMA {
  constructor(private readonly client: SportradarClient) {}

  /** Get upcoming UFC events */
  async getUFCEvents(): Promise<FightCard[]> {
    // Would query Sportradar MMA endpoint
    return [];
  }

  /** Get fighter profile */
  async getFighter(fighterId: string): Promise<Fighter | null> {
    return null;
  }

  /** Get fight card */
  async getFightCard(cardId: string): Promise<FightCard | null> {
    return null;
  }

  /** Predict fight outcome */
  predictFight(fighter1: Fighter, fighter2: Fighter, rounds: number = 3): FightPrediction {
    let f1Score = 0.5;
    const factors: string[] = [];

    // Record differential
    const f1WinRate = fighter1.record.wins / (fighter1.record.wins + fighter1.record.losses);
    const f2WinRate = fighter2.record.wins / (fighter2.record.wins + fighter2.record.losses);
    f1Score += (f1WinRate - f2WinRate) * 0.15;

    // Striking
    const strikeDiff = fighter1.stats.sigStrikesPerMin - fighter2.stats.sigStrikesPerMin;
    f1Score += strikeDiff * 0.05;
    if (Math.abs(strikeDiff) > 2) factors.push(`${strikeDiff > 0 ? fighter1.name : fighter2.name} has striking volume advantage`);

    // Grappling
    const tdDiff = fighter1.stats.takedownAvg - fighter2.stats.takedownAvg;
    f1Score += tdDiff * 0.03;

    // Reach
    const reachDiff = fighter1.stats.reach - fighter2.stats.reach;
    f1Score += reachDiff * 0.002;

    f1Score = Math.max(0.1, Math.min(0.9, f1Score));

    // Method prediction
    const koProb = (fighter1.stats.knockdownAvg + fighter2.stats.knockdownAvg) / 2 * 0.3;
    const subProb = (fighter1.stats.submissionAvg + fighter2.stats.submissionAvg) / 2 * 0.2;

    return {
      fighter1Id: fighter1.id,
      fighter2Id: fighter2.id,
      fighter1WinProb: f1Score,
      fighter2WinProb: 1 - f1Score,
      methodPrediction: {
        koProb: Math.min(0.5, koProb),
        submissionProb: Math.min(0.3, subProb),
        decisionProb: Math.max(0.2, 1 - koProb - subProb),
      },
      roundPrediction: {
        round1: 0.3,
        round2: 0.25,
        round3: 0.25,
        round4: rounds >= 4 ? 0.12 : undefined,
        round5: rounds >= 5 ? 0.08 : undefined,
      },
      factors,
      edge: Math.abs(f1Score - 0.5) * 2,
      recommendation: f1Score > 0.6 ? `Lean ${fighter1.name}` : f1Score < 0.4 ? `Lean ${fighter2.name}` : 'Close fight — pass',
    };
  }

  /** Compare fighters */
  compareFighters(f1: Fighter, f2: Fighter): {
    advantages: Record<string, string>;
    stylistic: string;
  } {
    const advantages: Record<string, string> = {};

    advantages.height = f1.stats.height > f2.stats.height ? f1.name : f2.name;
    advantages.reach = f1.stats.reach > f2.stats.reach ? f1.name : f2.name;
    advantages.striking = f1.stats.sigStrikesPerMin > f2.stats.sigStrikesPerMin ? f1.name : f2.name;
    advantages.grappling = f1.stats.takedownAvg > f2.stats.takedownAvg ? f1.name : f2.name;
    advantages.experience = f1.record.wins > f2.record.wins ? f1.name : f2.name;

    const f1Grappler = f1.stats.takedownAvg > 3;
    const f2Grappler = f2.stats.takedownAvg > 3;
    const f1Striker = f1.stats.sigStrikesPerMin > 5;
    const f2Striker = f2.stats.sigStrikesPerMin > 5;

    let stylistic = 'Well-rounded matchup';
    if (f1Grappler && f2Striker) stylistic = `${f1.name} will grapple, ${f2.name} wants to strike`;
    if (f1Striker && f2Grappler) stylistic = `${f1.name} wants to strike, ${f2.name} will shoot`;

    return { advantages, stylistic };
  }
}
