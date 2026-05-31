/**
 * Format Line Movement data for agent-friendly output
 */

import type { LineMovementData, LineValueAnalysis, SteamMove } from './types.js';

export class ResponseFormatter {
  static formatMovement(data: LineMovementData): string {
    const parts: string[] = [];
    parts.push(`📈 Line Movement: ${data.fixtureId} (${data.market})`);
    parts.push(`   Opening: Home ${data.openingLine.homeOdds} | Away ${data.openingLine.awayOdds}`);
    parts.push(`   Current: Home ${data.currentLine.homeOdds} | Away ${data.currentLine.awayOdds}`);
    parts.push(`   Movement: ${data.movement.direction}`);
    parts.push(`   Sharp Money: ${data.movement.sharpMoney}`);

    if (data.steamMoves.length > 0) {
      parts.push(`\n   Steam Moves: ${data.steamMoves.length}`);
      for (const steam of data.steamMoves.slice(0, 3)) {
        parts.push(`   - ${steam.direction} @ ${steam.timestamp} (${steam.magnitude.toFixed(2)} move)`);
      }
    }

    return parts.join('\n');
  }

  static formatSteamMoves(moves: SteamMove[]): string {
    if (moves.length === 0) return 'No steam moves detected.';
    return moves.map((m, i) =>
      `${i + 1}. ${m.direction.toUpperCase()} steam move @ ${m.timestamp}\n   Magnitude: ${m.magnitude.toFixed(2)} | Book: ${m.sportsbook}`
    ).join('\n');
  }

  static formatValueAnalysis(analysis: LineValueAnalysis): string {
    const parts: string[] = [];
    parts.push(`💰 Line Value Analysis`);
    parts.push(`   Current Odds: ${analysis.currentOdds}`);
    parts.push(`   Implied Probability: ${(analysis.impliedProbability * 100).toFixed(1)}%`);
    parts.push(`   Model Probability: ${(analysis.modelProbability * 100).toFixed(1)}%`);
    parts.push(`   Edge: ${(analysis.edge * 100).toFixed(1)}%`);
    parts.push(`   Best Odds: ${analysis.bestOdds} @ ${analysis.bestSportsbook}`);
    parts.push(`   Recommendation: ${analysis.recommendation.toUpperCase()}`);

    return parts.join('\n');
  }

  static formatForPrediction(data: LineMovementData, valueAnalysis?: LineValueAnalysis): string {
    const parts: string[] = [];
    parts.push(`## Line Movement Context`);
    parts.push(this.formatMovement(data));

    if (valueAnalysis) {
      parts.push('\n' + this.formatValueAnalysis(valueAnalysis));
    }

    return parts.join('\n');
  }
}
