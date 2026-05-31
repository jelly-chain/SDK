/**
 * Player Prop Market Engine
 * The growth market — player performance props, not just team outcomes.
 */

export type PropMarketType =
  | 'points' | 'rebounds' | 'assists' | 'three-pointers' | 'steals' | 'blocks' // NBA
  | 'passing-yards' | 'rushing-yards' | 'receiving-yards' | 'touchdowns' | 'completions' // NFL
  | 'goals' | 'assists' | 'shots' | 'shots-on-target' | 'cards' | 'passes-completed' // Football
  | 'strikeouts' | 'hits' | 'home-runs' | 'runs-batted-in' // MLB
  | 'goals' | 'assists' | 'shots' | 'saves' // NHL
  | 'aces' | 'double-faults' | 'games-won' | 'sets-won' // Tennis
  | 'knockdowns' | 'takedowns' | 'significant-strikes' | 'submission-attempts'; // MMA

export interface PlayerPropLine {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  sport: string;
  fixtureId: string;
  propType: PropMarketType;
  line: number; // Over/Under line
  overOdds: number; // Decimal odds
  underOdds: number;
  sportsbook: string;
  lastUpdated: string;
}

export interface PlayerPropAnalysis {
  playerId: string;
  playerName: string;
  propType: PropMarketType;
  line: number;
  seasonAverage: number;
  last5Average: number;
  last10Average: number;
  homeAwaySplit: { home: number; away: number };
  vsOpponent: number; // Average vs this opponent
  hitRate: {
    over: number; // % of games over the line
    under: number;
  };
  streak: {
    current: number;
    direction: 'over' | 'under';
    games: number;
  };
  edge: number; // Model probability vs implied odds
  recommendation: 'over' | 'under' | 'pass';
  confidence: number;
  factors: string[];
}

export interface PlayerPropConfig {
  minHitRate: number; // Minimum hit rate to recommend (e.g., 0.55)
  minEdge: number; // Minimum edge to recommend (e.g., 0.05)
  weightRecentForm: number; // How much to weight recent games (0-1)
  weightH2H: number; // How much to weight head-to-head (0-1)
}

export class PlayerPropEngine {
  private lines: Map<string, PlayerPropLine[]> = new Map();
  private config: PlayerPropConfig;

  constructor(config: Partial<PlayerPropConfig> = {}) {
    this.config = {
      minHitRate: config.minHitRate ?? 0.55,
      minEdge: config.minEdge ?? 0.05,
      weightRecentForm: config.weightRecentForm ?? 0.4,
      weightH2H: config.weightH2H ?? 0.2,
    };
  }

  /** Register prop lines */
  addLines(fixtureId: string, lines: PlayerPropLine[]): void {
    this.lines.set(fixtureId, lines);
  }

  /** Get lines for a fixture */
  getLines(fixtureId: string): PlayerPropLine[] {
    return this.lines.get(fixtureId) ?? [];
  }

  /** Get lines for a specific player */
  getPlayerLines(playerId: string): PlayerPropLine[] {
    const allLines: PlayerPropLine[] = [];
    for (const fixtureLines of this.lines.values()) {
      allLines.push(...fixtureLines.filter((l) => l.playerId === playerId));
    }
    return allLines;
  }

  /** Analyze a player prop */
  analyze(params: {
    line: PlayerPropLine;
    seasonAverage: number;
    last5Average: number;
    last10Average: number;
    homeAwaySplit: { home: number; away: number };
    vsOpponentAverage: number;
    hitRateOver: number;
    hitRateUnder: number;
    currentStreak: { direction: 'over' | 'under'; games: number };
    isHome: boolean;
  }): PlayerPropAnalysis {
    const {
      line, seasonAverage, last5Average, last10Average,
      homeAwaySplit, vsOpponentAverage, hitRateOver, hitRateUnder,
      currentStreak, isHome,
    } = params;

    // Calculate weighted average
    const homeAway = isHome ? homeAwaySplit.home : homeAwaySplit.away;
    const weightedAvg =
      seasonAverage * (1 - this.config.weightRecentForm - this.config.weightH2H) +
      last5Average * this.config.weightRecentForm +
      vsOpponentAverage * this.config.weightH2H;

    // Model probability of over
    const modelProbOver = this.calculateOverProbability(weightedAvg, line.line);

    // Implied probability from odds
    const impliedProbOver = 1 / line.overOdds;
    const impliedProbUnder = 1 / line.underOdds;

    // Edge calculation
    const edgeOver = modelProbOver - impliedProbOver;
    const edgeUnder = (1 - modelProbOver) - impliedProbUnder;

    // Recommendation
    let recommendation: 'over' | 'under' | 'pass';
    let confidence: number;
    const factors: string[] = [];

    if (edgeOver > this.config.minEdge && hitRateOver > this.config.minHitRate) {
      recommendation = 'over';
      confidence = Math.min(0.9, modelProbOver);
      if (last5Average > line.line) factors.push('Recent form supports over');
      if (homeAway > line.line) factors.push('Home/away split supports over');
      if (currentStreak.direction === 'over') factors.push(`On ${currentStreak.games}-game over streak`);
    } else if (edgeUnder > this.config.minEdge && hitRateUnder > this.config.minHitRate) {
      recommendation = 'under';
      confidence = Math.min(0.9, 1 - modelProbOver);
      if (last5Average < line.line) factors.push('Recent form supports under');
      if (homeAway < line.line) factors.push('Home/away split supports under');
      if (currentStreak.direction === 'under') factors.push(`On ${currentStreak.games}-game under streak`);
    } else {
      recommendation = 'pass';
      confidence = 0;
      factors.push('Insufficient edge or hit rate');
    }

    if (Math.abs(weightedAvg - line.line) > line.line * 0.2) {
      factors.push(`Model average (${weightedAvg.toFixed(1)}) significantly differs from line (${line.line})`);
    }

    return {
      playerId: line.playerId,
      playerName: line.playerName,
      propType: line.propType,
      line: line.line,
      seasonAverage,
      last5Average,
      last10Average,
      homeAwaySplit,
      vsOpponent: vsOpponentAverage,
      hitRate: { over: hitRateOver, under: hitRateUnder },
      streak: currentStreak,
      edge: recommendation === 'over' ? edgeOver : recommendation === 'under' ? edgeUnder : 0,
      recommendation,
      confidence,
      factors,
    };
  }

  /** Calculate probability of going over a line using Poisson distribution */
  private calculateOverProbability(expected: number, line: number): number {
    // Poisson CDF complement
    let prob = 0;
    for (let k = 0; k <= Math.floor(line); k++) {
      prob += this.poissonPMF(k, expected);
    }
    return 1 - prob;
  }

  private poissonPMF(k: number, lambda: number): number {
    return Math.exp(-lambda) * Math.pow(lambda, k) / this.factorial(k);
  }

  private factorial(n: number): number {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  /** Scan all props for a fixture and find best bets */
  findBestProps(fixtureId: string, analyses: PlayerPropAnalysis[]): PlayerPropAnalysis[] {
    return analyses
      .filter((a) => a.recommendation !== 'pass' && a.confidence > 0.55)
      .sort((a, b) => b.edge - a.edge)
      .slice(0, 5);
  }
}
