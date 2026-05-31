import type { LineMovementData, LineValueAnalysis } from './types.js';

export class LineDetector {
  /** Analyze line value */
  analyzeLineValue(
    movement: LineMovementData,
    modelProbability: number,
    side: 'home' | 'away',
  ): LineValueAnalysis {
    const currentOdds = side === 'home' ? movement.currentLine.homeOdds : movement.currentLine.awayOdds;
    const impliedProbability = 1 / currentOdds;
    const edge = modelProbability - impliedProbability;

    // Find best odds across all snapshots
    let bestOdds = 0;
    let bestSportsbook = '';
    for (const snap of movement.snapshots) {
      const odds = side === 'home' ? snap.homeOdds : snap.awayOdds;
      if (odds > bestOdds) {
        bestOdds = odds;
        bestSportsbook = snap.sportsbook;
      }
    }

    return {
      currentOdds,
      impliedProbability: Math.round(impliedProbability * 1000) / 1000,
      modelProbability,
      edge: Math.round(edge * 1000) / 1000,
      bestOdds,
      bestSportsbook,
      recommendation: edge > 0.03 ? 'bet' : 'pass',
    };
  }

  /** Detect reverse line movement */
  detectRLM(movement: LineMovementData): {
    hasRLM: boolean;
    direction: string;
    confidence: number;
  } {
    // RLM = line moves opposite to where public is betting
    // Without public betting data, use steam moves as proxy
    const totalMove = Math.abs(movement.movement.homeOddsDelta) + Math.abs(movement.movement.awayOddsDelta);
    const hasRLM = totalMove > 0.3 && movement.steamMoves.length >= 2;

    return {
      hasRLM,
      direction: movement.movement.direction,
      confidence: hasRLM ? 0.6 : 0.2,
    };
  }

  /** Detect stale lines */
  detectStaleLine(movement: LineMovementData, thresholdMinutes: number = 30): {
    isStale: boolean;
    minutesSinceUpdate: number;
    recommendation: string;
  } {
    const lastUpdate = new Date(movement.currentLine.timestamp).getTime();
    const now = Date.now();
    const minutesSinceUpdate = (now - lastUpdate) / 60000;

    return {
      isStale: minutesSinceUpdate > thresholdMinutes,
      minutesSinceUpdate: Math.round(minutesSinceUpdate),
      recommendation: minutesSinceUpdate > thresholdMinutes
        ? 'Line may be stale — check for news before betting'
        : 'Line is fresh',
    };
  }
}
