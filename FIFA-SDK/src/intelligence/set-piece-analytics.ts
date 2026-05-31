/**
 * Set Piece Analytics Module
 * Corner/free kick conversion rates for prop markets.
 */

export interface SetPieceStats {
  teamId: string;
  season: string;
  corners: {
    total: number;
    per90: number;
    conversionRate: number; // % that lead to shots
    goalRate: number; // % that lead to goals
    shortCornerRate: number;
    nearPostRate: number;
    farPostRate: number;
  };
  freeKicks: {
    total: number;
    directShots: number;
    directGoals: number;
    directConversionRate: number;
    indirectShots: number;
    indirectGoals: number;
    indirectConversionRate: number;
  };
  penalties: {
    awarded: number;
    scored: number;
    missed: number;
    saved: number;
    conversionRate: number;
  };
  throwIns: {
    longThrowSpecialist: boolean;
    avgDistance: number;
    goalsFromThrowIns: number;
  };
}

export interface SetPieceMatchup {
  homeTeamId: string;
  awayTeamId: string;
  homeCornerStrength: number; // 0-1
  awayCornerStrength: number;
  homeFreeKickStrength: number;
  awayFreeKickStrength: number;
  expectedCorners: {
    home: number;
    away: number;
    total: number;
  };
  expectedSetPieceGoals: {
    home: number;
    away: number;
    total: number;
  };
  bettingAngles: string[];
}

export class SetPieceAnalytics {
  private stats: Map<string, SetPieceStats> = new Map();

  /** Register team set piece stats */
  register(stats: SetPieceStats): void {
    this.stats.set(stats.teamId, stats);
  }

  /** Get stats for a team */
  getStats(teamId: string): SetPieceStats | undefined {
    return this.stats.get(teamId);
  }

  /** Analyze set piece matchup between two teams */
  analyze(homeTeamId: string, awayTeamId: string): SetPieceMatchup | null {
    const home = this.stats.get(homeTeamId);
    const away = this.stats.get(awayTeamId);
    if (!home || !away) return null;

    // Corner strength = conversion rate * volume
    const homeCornerStrength = (home.corners.conversionRate * home.corners.per90) / 10;
    const awayCornerStrength = (away.corners.conversionRate * away.corners.per90) / 10;

    // Free kick strength = direct + indirect goal rates
    const homeFreeKickStrength = (home.freeKicks.directConversionRate + home.freeKicks.indirectConversionRate) / 2;
    const awayFreeKickStrength = (away.freeKicks.directConversionRate + away.freeKicks.indirectConversionRate) / 2;

    // Expected corners (home team usually gets more)
    const expectedHomeCorners = Math.round((home.corners.per90 * 1.1 + away.corners.per90 * 0.9) / 2 * 10) / 10;
    const expectedAwayCorners = Math.round((away.corners.per90 * 0.9 + home.corners.per90 * 1.1) / 2 * 10) / 10;

    // Expected set piece goals
    const expectedHomeSPGoals = Math.round((home.corners.goalRate * expectedHomeCorners + home.freeKicks.directConversionRate * 0.5) * 100) / 100;
    const expectedAwaySPGoals = Math.round((away.corners.goalRate * expectedAwayCorners + away.freeKicks.directConversionRate * 0.5) * 100) / 100;

    // Betting angles
    const bettingAngles: string[] = [];
    if (home.corners.per90 > 6) bettingAngles.push(`High corner count expected for ${homeTeamId} (${home.corners.per90}/game)`);
    if (away.corners.per90 > 6) bettingAngles.push(`High corner count expected for ${awayTeamId} (${away.corners.per90}/game)`);
    if (home.freeKicks.directConversionRate > 0.08) bettingAngles.push(`${homeTeamId} dangerous from direct free kicks (${(home.freeKicks.directConversionRate * 100).toFixed(1)}%)`);
    if (away.freeKicks.directConversionRate > 0.08) bettingAngles.push(`${awayTeamId} dangerous from direct free kicks (${(away.freeKicks.directConversionRate * 100).toFixed(1)}%)`);
    if (home.penalties.conversionRate > 0.85) bettingAngles.push(`${homeTeamId} reliable penalty takers (${(home.penalties.conversionRate * 100).toFixed(0)}%)`);
    if (away.penalties.conversionRate > 0.85) bettingAngles.push(`${awayTeamId} reliable penalty takers (${(away.penalties.conversionRate * 100).toFixed(0)}%)`);
    if (home.throwIns.longThrowSpecialist) bettingAngles.push(`${homeTeamId} has long throw specialist — watch for near-post flick-ons`);

    return {
      homeTeamId,
      awayTeamId,
      homeCornerStrength,
      awayCornerStrength,
      homeFreeKickStrength,
      awayFreeKickStrength,
      expectedCorners: {
        home: expectedHomeCorners,
        away: expectedAwayCorners,
        total: expectedHomeCorners + expectedAwayCorners,
      },
      expectedSetPieceGoals: {
        home: expectedHomeSPGoals,
        away: expectedAwaySPGoals,
        total: expectedHomeSPGoals + expectedAwaySPGoals,
      },
      bettingAngles,
    };
  }

  /** Get over/under corner probabilities */
  cornerProbabilities(homeTeamId: string, awayTeamId: string): {
    over8_5: number;
    over9_5: number;
    over10_5: number;
    over11_5: number;
    over12_5: number;
  } | null {
    const matchup = this.analyze(homeTeamId, awayTeamId);
    if (!matchup) return null;

    const expected = matchup.expectedCorners.total;
    // Poisson approximation
    const poissonP = (k: number, lambda: number) => Math.exp(-lambda) * Math.pow(lambda, k) / this.factorial(k);

    const over = (line: number) => {
      let p = 0;
      for (let k = Math.ceil(line); k <= 30; k++) {
        p += poissonP(k, expected);
      }
      return Math.max(0, Math.min(1, p));
    };

    return {
      over8_5: over(8.5),
      over9_5: over(9.5),
      over10_5: over(10.5),
      over11_5: over(11.5),
      over12_5: over(12.5),
    };
  }

  private factorial(n: number): number {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }
}
