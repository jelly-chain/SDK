/**
 * UFC/MMA Fight Card Scraper
 * Full card data for fight predictions.
 */

export type WeightClass =
  | 'strawweight' | 'flyweight' | 'bantamweight' | 'featherweight'
  | 'lightweight' | 'welterweight' | 'middleweight' | 'light-heavyweight'
  | 'heavyweight' | 'womens-strawweight' | 'womens-flyweight'
  | 'womens-bantamweight' | 'womens-featherweight';

export type FightResult = 'ko-tko' | 'submission' | 'decision' | 'draw' | 'no-contest' | 'dq';

export interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  country: string;
  weightClass: WeightClass;
  record: { wins: number; losses: number; draws: number; noContests: number };
  ranking?: number;
  champion: boolean;
  stats: {
    height: number; // cm
    reach: number; // cm
    stance: 'orthodox' | 'southpaw' | 'switch';
    sigStrikesPerMin: number;
    sigStrikeAccuracy: number; // percentage
    takedownAvg: number;
    takedownAccuracy: number;
    submissionAvg: number;
    knockdownAvg: number;
    sigStrikeDefense: number;
    takedownDefense: number;
  };
  recentForm: Array<{ opponent: string; result: FightResult; method: string; round: number }>;
}

export interface Fight {
  id: string;
  cardId: string;
  boutNumber: number; // 1 = main event, 2 = co-main, etc.
  weightClass: WeightClass;
  isTitleFight: boolean;
  isMainEvent: boolean;
  isCoMain: boolean;
  rounds: number; // 3 or 5
  fighter1Id: string;
  fighter2Id: string;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  result?: {
    winner: string;
    method: FightResult;
    round: number;
    time: string; // e.g. "3:42"
  };
  odds?: {
    fighter1: number;
    fighter2: number;
  };
}

export interface FightCard {
  id: string;
  name: string; // e.g. "UFC 300"
  date: string;
  venue: string;
  city: string;
  country: string;
  promotion: 'UFC' | 'Bellator' | 'ONE' | 'PFL' | 'BKFC';
  fights: Fight[];
  isPPV: boolean;
  broadcast: string;
}

export interface FightPrediction {
  fighter1Id: string;
  fighter2Id: string;
  fighter1WinProb: number;
  fighter2WinProb: number;
  methodPrediction: {
    koProb: number;
    submissionProb: number;
    decisionProb: number;
  };
  roundPrediction: {
    round1: number;
    round2: number;
    round3: number;
    round4?: number;
    round5?: number;
  };
  factors: string[];
  edge: number;
  recommendation: string;
}

export interface FighterComparison {
  fighter1: Fighter;
  fighter2: Fighter;
  advantages: {
    height: string;
    reach: string;
    striking: string;
    grappling: string;
    cardio: string;
    experience: string;
  };
  stylistic: string;
}

export class UFCModule {
  private fighters: Map<string, Fighter> = new Map();
  private cards: Map<string, FightCard> = new Map();

  /** Register a fighter */
  addFighter(fighter: Fighter): void {
    this.fighters.set(fighter.id, fighter);
  }

  /** Register a fight card */
  addCard(card: FightCard): void {
    this.cards.set(card.id, card);
  }

  /** Get fighter by ID */
  getFighter(fighterId: string): Fighter | undefined {
    return this.fighters.get(fighterId);
  }

  /** Get fighter by name */
  getFighterByName(name: string): Fighter | undefined {
    return Array.from(this.fighters.values()).find((f) =>
      f.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /** Get all fighters in a weight class */
  getWeightClass(weightClass: WeightClass): Fighter[] {
    return Array.from(this.fighters.values())
      .filter((f) => f.weightClass === weightClass)
      .sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99));
  }

  /** Get upcoming cards */
  getUpcomingCards(): FightCard[] {
    const now = new Date();
    return Array.from(this.cards.values())
      .filter((c) => new Date(c.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /** Get a specific card */
  getCard(cardId: string): FightCard | undefined {
    return this.cards.get(cardId);
  }

  /** Compare two fighters */
  compareFighters(fighter1Id: string, fighter2Id: string): FighterComparison | null {
    const fighter1 = this.fighters.get(fighter1Id);
    const fighter2 = this.fighters.get(fighter2Id);
    if (!fighter1 || !fighter2) return null;

    const heightAdvantage = fighter1.stats.height > fighter2.stats.height ? fighter1.name :
      fighter2.stats.height > fighter1.stats.height ? fighter2.name : 'Even';
    const reachAdvantage = fighter1.stats.reach > fighter2.stats.reach ? fighter1.name :
      fighter2.stats.reach > fighter1.stats.reach ? fighter2.name : 'Even';
    const strikingAdvantage = fighter1.stats.sigStrikesPerMin > fighter2.stats.sigStrikesPerMin ? fighter1.name :
      fighter2.stats.sigStrikesPerMin > fighter1.stats.sigStrikesPerMin ? fighter2.name : 'Even';
    const grapplingAdvantage = fighter1.stats.takedownAvg > fighter2.stats.takedownAvg ? fighter1.name :
      fighter2.stats.takedownAvg > fighter1.stats.takedownAvg ? fighter2.name : 'Even';

    return {
      fighter1,
      fighter2,
      advantages: {
        height: heightAdvantage,
        reach: reachAdvantage,
        striking: strikingAdvantage,
        grappling: grapplingAdvantage,
        cardio: 'TBD', // Would need more data
        experience: fighter1.record.wins > fighter2.record.wins ? fighter1.name : fighter2.name,
      },
      stylistic: this.describeStylistic(fighter1, fighter2),
    };
  }

  /** Predict fight outcome */
  predictFight(fighter1Id: string, fighter2Id: string): FightPrediction | null {
    const f1 = this.fighters.get(fighter1Id);
    const f2 = this.fighters.get(fighter2Id);
    if (!f1 || !f2) return null;

    let f1Score = 0.5;
    const factors: string[] = [];

    // Record differential
    const f1WinRate = f1.record.wins / (f1.record.wins + f1.record.losses);
    const f2WinRate = f2.record.wins / (f2.record.wins + f2.record.losses);
    f1Score += (f1WinRate - f2WinRate) * 0.15;

    // Ranking
    if (f1.ranking && f2.ranking) {
      const rankDiff = f2.ranking - f1.ranking;
      f1Score += rankDiff * 0.01;
      if (Math.abs(rankDiff) > 5) factors.push(`Ranking gap: ${Math.abs(rankDiff)} positions`);
    }

    // Striking advantage
    const strikeDiff = f1.stats.sigStrikesPerMin - f2.stats.sigStrikesPerMin;
    f1Score += strikeDiff * 0.05;
    if (Math.abs(strikeDiff) > 2) factors.push(`${strikeDiff > 0 ? f1.name : f2.name} has significant striking volume advantage`);

    // Takedown advantage
    const tdDiff = f1.stats.takedownAvg - f2.stats.takedownAvg;
    f1Score += tdDiff * 0.03;
    if (Math.abs(tdDiff) > 2) factors.push(`${tdDiff > 0 ? f1.name : f2.name} has grappling advantage`);

    // Reach advantage
    const reachDiff = f1.stats.reach - f2.stats.reach;
    f1Score += reachDiff * 0.002;
    if (Math.abs(reachDiff) > 10) factors.push(`${reachDiff > 0 ? f1.name : f2.name} has ${Math.abs(reachDiff)}cm reach advantage`);

    // Recent form
    const f1RecentWins = f1.recentForm.filter((r) => r.result !== 'no-contest' && r.winner === f1Id(f1)).length;
    const f2RecentWins = f2.recentForm.filter((r) => r.result !== 'no-contest' && r.winner === fId(f2)).length;

    f1Score = Math.max(0.1, Math.min(0.9, f1Score));

    // Method prediction
    const koProb = this.estimateMethodProb(f1, f2, 'ko-tko');
    const subProb = this.estimateMethodProb(f1, f2, 'submission');
    const decProb = 1 - koProb - subProb;

    return {
      fighter1Id,
      fighter2Id,
      fighter1WinProb: f1Score,
      fighter2WinProb: 1 - f1Score,
      methodPrediction: {
        koProb: Math.round(koProb * 100) / 100,
        submissionProb: Math.round(subProb * 100) / 100,
        decisionProb: Math.round(decProb * 100) / 100,
      },
      roundPrediction: {
        round1: 0.25,
        round2: 0.25,
        round3: 0.25,
        round4: f1Score > 0.6 || f1Score < 0.4 ? 0.15 : 0.125,
        round5: f1Score > 0.6 || f1Score < 0.4 ? 0.1 : 0.125,
      },
      factors,
      edge: Math.abs(f1Score - 0.5) * 2,
      recommendation: f1Score > 0.6 ? `Lean ${f1.name}` : f1Score < 0.4 ? `Lean ${f2.name}` : 'Pass — close fight',
    };
  }

  private estimateMethodProb(f1: Fighter, f2: Fighter, method: FightResult): number {
    if (method === 'ko-tko') {
      const avgKnockdowns = (f1.stats.knockdownAvg + f2.stats.knockdownAvg) / 2;
      return Math.min(0.5, avgKnockdowns * 0.3);
    }
    if (method === 'submission') {
      const avgSubs = (f1.stats.submissionAvg + f2.stats.submissionAvg) / 2;
      return Math.min(0.3, avgSubs * 0.2);
    }
    return 0.3; // Decision baseline
  }

  private describeStylistic(f1: Fighter, f2: Fighter): string {
    const f1Grappler = f1.stats.takedownAvg > 3;
    const f2Grappler = f2.stats.takedownAvg > 3;
    const f1Striker = f1.stats.sigStrikesPerMin > 5;
    const f2Striker = f2.stats.sigStrikesPerMin > 5;

    if (f1Grappler && f2Striker) return `${f1.name} will look to grapple, ${f2.name} wants to keep it standing`;
    if (f1Striker && f2Grappler) return `${f1.name} wants to strike, ${f2.name} will shoot for takedowns`;
    if (f1Striker && f2Striker) return 'Striker vs striker — expect a standup war';
    if (f1Grappler && f2Grappler) return 'Grappler vs grappler — ground battle likely';
    return 'Well-rounded matchup';
  }
}

// Helper functions
function fId(fighter: Fighter): string { return fighter.id; }
function f1Id(fighter: Fighter): string { return fighter.id; }
