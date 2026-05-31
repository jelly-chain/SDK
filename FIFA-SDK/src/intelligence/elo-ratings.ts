/**
 * Historical Elo Rating Integration
 * Elo is better than FIFA rankings for prediction because it's performance-based, not politics-based.
 */

export interface EloRating {
  teamId: string;
  rating: number;
  peak: number;
  trough: number;
  lastUpdated: string;
  matchesPlayed: number;
  trend: 'rising' | 'falling' | 'stable';
  trendDelta: number; // change over last 10 matches
}

export interface EloMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  date: string;
  isNeutral: boolean;
  isCompetitive: boolean;
  kFactor?: number;
}

export interface EloPrediction {
  homeTeamId: string;
  awayTeamId: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
}

const DEFAULT_K = 60;
const WORLD_CUP_K = 80;
const FRIENDLY_K = 30;
const HOME_ADVANTAGE = 100; // ~0.04 win probability boost

export class EloEngine {
  private ratings: Map<string, EloRating> = new Map();

  /** Initialize or get a team's rating */
  getRating(teamId: string): EloRating {
    if (!this.ratings.has(teamId)) {
      this.ratings.set(teamId, {
        teamId,
        rating: 1500,
        peak: 1500,
        trough: 1500,
        lastUpdated: new Date().toISOString(),
        matchesPlayed: 0,
        trend: 'stable',
        trendDelta: 0,
      });
    }
    return this.ratings.get(teamId)!;
  }

  /** Set a team's rating explicitly */
  setRating(teamId: string, rating: number): void {
    const existing = this.getRating(teamId);
    existing.rating = rating;
    existing.peak = Math.max(existing.peak, rating);
    existing.trough = Math.min(existing.trough, rating);
  }

  /** Process a match result and update ratings */
  processMatch(match: EloMatch): { homeDelta: number; awayDelta: number } {
    const home = this.getRating(match.homeTeamId);
    const away = this.getRating(match.awayTeamId);

    const k = match.kFactor ?? (match.isCompetitive ? WORLD_CUP_K : FRIENDLY_K);

    // Expected scores
    const homeAdvantage = match.isNeutral ? 0 : HOME_ADVANTAGE;
    const expectedHome = 1 / (1 + Math.pow(10, (away.rating - home.rating - homeAdvantage) / 400));
    const expectedAway = 1 - expectedHome;

    // Actual scores
    let actualHome: number;
    let actualAway: number;
    if (match.homeScore > match.awayScore) {
      actualHome = 1;
      actualAway = 0;
    } else if (match.homeScore < match.awayScore) {
      actualHome = 0;
      actualAway = 1;
    } else {
      actualHome = 0.5;
      actualAway = 0.5;
    }

    // Goal difference multiplier
    const goalDiff = Math.abs(match.homeScore - match.awayScore);
    const goalDiffMultiplier = goalDiff <= 1 ? 1 : Math.log(goalDiff) + 1;

    const homeDelta = Math.round(k * goalDiffMultiplier * (actualHome - expectedHome));
    const awayDelta = Math.round(k * goalDiffMultiplier * (actualAway - expectedAway));

    // Apply deltas
    home.rating += homeDelta;
    away.rating += awayDelta;
    home.matchesPlayed++;
    away.matchesPlayed++;
    home.lastUpdated = match.date;
    away.lastUpdated = match.date;

    // Update peak/trough
    home.peak = Math.max(home.peak, home.rating);
    home.trough = Math.min(home.trough, home.rating);
    away.peak = Math.max(away.peak, away.rating);
    away.trough = Math.min(away.trough, away.rating);

    return { homeDelta, awayDelta };
  }

  /** Predict match outcome based on Elo ratings */
  predict(homeTeamId: string, awayTeamId: string, isNeutral = false): EloPrediction {
    const home = this.getRating(homeTeamId);
    const away = this.getRating(awayTeamId);

    const homeAdvantage = isNeutral ? 0 : HOME_ADVANTAGE;
    const homeWinProb = 1 / (1 + Math.pow(10, (away.rating - home.rating - homeAdvantage) / 400));
    const awayWinProb = 1 / (1 + Math.pow(10, (home.rating - away.rating + homeAdvantage) / 400));

    // Draw probability approximation
    const drawProb = Math.max(0.1, 1 - homeWinProb - awayWinProb);
    const total = homeWinProb + drawProb + awayWinProb;

    // Expected goals from Elo
    const ratingDiff = home.rating - away.rating + homeAdvantage;
    const expectedHomeGoals = Math.max(0.3, 1.5 + ratingDiff / 500);
    const expectedAwayGoals = Math.max(0.3, 1.5 - ratingDiff / 500);

    return {
      homeTeamId,
      awayTeamId,
      homeWinProb: homeWinProb / total,
      drawProb: drawProb / total,
      awayWinProb: awayWinProb / total,
      expectedHomeGoals,
      expectedAwayGoals,
    };
  }

  /** Compare Elo vs FIFA ranking */
  compareRanking(teamId: string, fifaRanking: number): {
    eloRating: number;
    eloRank: number;
    fifaRank: number;
    discrepancy: number;
    assessment: string;
  } {
    const rating = this.getRating(teamId);

    // Calculate Elo rank
    const allRatings = Array.from(this.ratings.values())
      .sort((a, b) => b.rating - a.rating);
    const eloRank = allRatings.findIndex((r) => r.teamId === teamId) + 1;

    const discrepancy = Math.abs(eloRank - fifaRank);
    const assessment =
      discrepancy > 10
        ? 'Significant disagreement between Elo and FIFA ranking'
        : discrepancy > 5
          ? 'Moderate disagreement'
          : 'Roughly aligned';

    return {
      eloRating: rating.rating,
      eloRank,
      fifaRank,
      discrepancy,
      assessment,
    };
  }

  /** Get all ratings sorted by Elo */
  getAllRatings(): EloRating[] {
    return Array.from(this.ratings.values())
      .sort((a, b) => b.rating - a.rating);
  }

  /** Get top N teams by Elo */
  getTopTeams(n: number): EloRating[] {
    return this.getAllRatings().slice(0, n);
  }

  /** Check if a team's Elo is trending */
  updateTrend(teamId: string, recentMatches: EloMatch[]): void {
    const rating = this.getRating(teamId);
    if (recentMatches.length < 3) {
      rating.trend = 'stable';
      rating.trendDelta = 0;
      return;
    }

    // Simulate processing recent matches to get trend
    let currentRating = rating.rating;
    const startRating = currentRating;

    for (const match of recentMatches.slice(-10)) {
      const isHome = match.homeTeamId === teamId;
      const k = match.kFactor ?? DEFAULT_K;
      const expected = isHome
        ? 1 / (1 + Math.pow(10, (1500 - currentRating) / 400))
        : 1 / (1 + Math.pow(10, (currentRating - 1500) / 400));
      const actual = isHome
        ? (match.homeScore > match.awayScore ? 1 : match.homeScore < match.awayScore ? 0 : 0.5)
        : (match.awayScore > match.homeScore ? 1 : match.awayScore < match.homeScore ? 0 : 0.5);
      currentRating += k * (actual - expected);
    }

    rating.trendDelta = currentRating - startRating;
    rating.trend = rating.trendDelta > 10 ? 'rising' : rating.trendDelta < -10 ? 'falling' : 'stable';
  }
}
