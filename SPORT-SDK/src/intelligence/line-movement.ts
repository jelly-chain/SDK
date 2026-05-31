/**
 * Line Movement Tracker
 * Store and visualize how odds change over time per fixture.
 */

export interface OddsSnapshot {
  timestamp: string;
  sportsbook: string;
  market: string; // e.g. "moneyline", "spread", "total"
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  spread?: number;
  total?: number;
  overOdds?: number;
  underOdds?: number;
}

export interface LineMovement {
  fixtureId: string;
  market: string;
  snapshots: OddsSnapshot[];
  openingLine: OddsSnapshot;
  currentLine: OddsSnapshot;
  movement: {
    homeOddsDelta: number;
    awayOddsDelta: number;
    spreadDelta?: number;
    totalDelta?: number;
    direction: 'toward-home' | 'toward-away' | 'stable';
    sharpMoney: 'home' | 'away' | 'none' | 'unclear';
  };
  steamMoves: SteamMove[];
  reverseLineMovement: boolean;
}

export interface SteamMove {
  timestamp: string;
  market: string;
  direction: 'home' | 'away';
  magnitude: number; // How much the line moved
  possibleCauses: string[];
}

export interface LineMovementAlert {
  fixtureId: string;
  type: 'steam' | 'reverse' | 'significant' | 'injury' | 'weather';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export class LineMovementTracker {
  private movements: Map<string, LineMovement[]> = new Map();
  private alerts: LineMovementAlert[] = [];

  /** Record an odds snapshot */
  record(fixtureId: string, snapshot: OddsSnapshot): void {
    const key = `${fixtureId}-${snapshot.market}`;
    let movement = this.movements.get(fixtureId)?.find((m) => m.market === snapshot.market);

    if (!movement) {
      const newMovement: LineMovement = {
        fixtureId,
        market: snapshot.market,
        snapshots: [snapshot],
        openingLine: snapshot,
        currentLine: snapshot,
        movement: {
          homeOddsDelta: 0,
          awayOddsDelta: 0,
          direction: 'stable',
          sharpMoney: 'none',
        },
        steamMoves: [],
        reverseLineMovement: false,
      };

      const existing = this.movements.get(fixtureId) ?? [];
      existing.push(newMovement);
      this.movements.set(fixtureId, existing);
    } else {
      movement.snapshots.push(snapshot);
      const prev = movement.currentLine;
      movement.currentLine = snapshot;

      // Calculate movement
      movement.movement.homeOddsDelta = snapshot.homeOdds - movement.openingLine.homeOdds;
      movement.movement.awayOddsDelta = snapshot.awayOdds - movement.openingLine.awayOdds;

      if (snapshot.spread !== undefined && movement.openingLine.spread !== undefined) {
        movement.movement.spreadDelta = snapshot.spread - movement.openingLine.spread;
      }
      if (snapshot.total !== undefined && movement.openingLine.total !== undefined) {
        movement.movement.totalDelta = snapshot.total - movement.openingLine.total;
      }

      // Determine direction
      const homeChange = snapshot.homeOdds - prev.homeOdds;
      const awayChange = snapshot.awayOdds - prev.awayOdds;
      movement.movement.direction =
        Math.abs(homeChange - awayChange) < 0.05 ? 'stable' :
        homeChange < 0 ? 'toward-home' : 'toward-away';

      // Detect steam moves (rapid line movement)
      const timeDiff = new Date(snapshot.timestamp).getTime() - new Date(prev.timestamp).getTime();
      if (timeDiff < 300000 && Math.abs(homeChange) > 0.1) { // 5 min window, >10 cent move
        const steam: SteamMove = {
          timestamp: snapshot.timestamp,
          market: snapshot.market,
          direction: homeChange < 0 ? 'home' : 'away',
          magnitude: Math.abs(homeChange),
          possibleCauses: ['sharp-money', 'injury-news', 'weather-update'],
        };
        movement.steamMoves.push(steam);

        this.alerts.push({
          fixtureId,
          type: 'steam',
          message: `Steam move on ${snapshot.market}: line moved ${steam.magnitude.toFixed(2)} toward ${steam.direction}`,
          timestamp: snapshot.timestamp,
          severity: steam.magnitude > 0.2 ? 'critical' : 'warning',
        });
      }

      // Detect reverse line movement (line moves opposite to public betting %)
      // This would need public betting data to fully implement
      movement.reverseLineMovement = this.detectReverseLineMovement(movement);

      // Detect sharp money
      movement.movement.sharpMoney = this.detectSharpMoney(movement);
    }
  }

  /** Get line movement for a fixture */
  getMovement(fixtureId: string): LineMovement[] {
    return this.movements.get(fixtureId) ?? [];
  }

  /** Get movement for a specific market */
  getMarketMovement(fixtureId: string, market: string): LineMovement | undefined {
    return this.movements.get(fixtureId)?.find((m) => m.market === market);
  }

  /** Get all alerts */
  getAlerts(fixtureId?: string): LineMovementAlert[] {
    if (fixtureId) return this.alerts.filter((a) => a.fixtureId === fixtureId);
    return [...this.alerts];
  }

  /** Detect reverse line movement */
  private detectReverseLineMovement(movement: LineMovement): boolean {
    // RLM = line moves against where the majority of bets are placed
    // Simplified: if line moves significantly in one direction
    const totalMove = Math.abs(movement.movement.homeOddsDelta) + Math.abs(movement.movement.awayOddsDelta);
    return totalMove > 0.3 && movement.steamMoves.length >= 2;
  }

  /** Detect sharp money direction */
  private detectSharpMoney(movement: LineMovement): 'home' | 'away' | 'none' | 'unclear' {
    if (movement.steamMoves.length === 0) return 'none';

    const homeSteams = movement.steamMoves.filter((s) => s.direction === 'home').length;
    const awaySteams = movement.steamMoves.filter((s) => s.direction === 'away').length;

    if (homeSteams > awaySteams + 1) return 'home';
    if (awaySteams > homeSteams + 1) return 'away';
    if (movement.steamMoves.length > 0) return 'unclear';
    return 'none';
  }

  /** Get historical line chart data for visualization */
  getChartData(fixtureId: string, market: string): {
    timestamps: string[];
    homeOdds: number[];
    awayOdds: number[];
    spread?: number[];
    total?: number[];
  } | null {
    const movement = this.getMarketMovement(fixtureId, market);
    if (!movement) return null;

    return {
      timestamps: movement.snapshots.map((s) => s.timestamp),
      homeOdds: movement.snapshots.map((s) => s.homeOdds),
      awayOdds: movement.snapshots.map((s) => s.awayOdds),
      spread: movement.snapshots.some((s) => s.spread !== undefined)
        ? movement.snapshots.map((s) => s.spread ?? 0)
        : undefined,
      total: movement.snapshots.some((s) => s.total !== undefined)
        ? movement.snapshots.map((s) => s.total ?? 0)
        : undefined,
    };
  }

  /** Analyze line value */
  analyzeLineValue(fixtureId: string, market: string, modelProbability: number): {
    currentOdds: number;
    impliedProbability: number;
    edge: number;
    bestOdds: number;
    bestSportsbook: string;
    recommendation: 'bet' | 'pass';
  } | null {
    const movement = this.getMarketMovement(fixtureId, market);
    if (!movement) return null;

    // Find best odds across all snapshots
    let bestOdds = 0;
    let bestSportsbook = '';
    for (const snap of movement.snapshots) {
      if (snap.homeOdds > bestOdds) {
        bestOdds = snap.homeOdds;
        bestSportsbook = snap.sportsbook;
      }
    }

    const currentOdds = movement.currentLine.homeOdds;
    const impliedProbability = 1 / currentOdds;
    const edge = modelProbability - impliedProbability;

    return {
      currentOdds,
      impliedProbability: Math.round(impliedProbability * 1000) / 1000,
      edge: Math.round(edge * 1000) / 1000,
      bestOdds,
      bestSportsbook,
      recommendation: edge > 0.03 ? 'bet' : 'pass',
    };
  }
}
