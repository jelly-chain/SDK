/**
 * Format Cricket data for agent-friendly output
 */

import type { CricketMatch, CricketTeam, CricketInnings, CricketPrediction } from '../types.js';

export class ResponseFormatter {
  static formatMatch(match: CricketMatch, homeTeam?: CricketTeam, awayTeam?: CricketTeam): string {
    const home = homeTeam?.name ?? match.homeTeamId;
    const away = awayTeam?.name ?? match.awayTeamId;
    const status = match.status === 'live' ? '🔴 LIVE' : match.status === 'finished' ? '✅ Final' : '⏰ Scheduled';

    let score = 'vs';
    if (match.innings.length > 0) {
      const homeInnings = match.innings.filter((i) => i.teamId === match.homeTeamId);
      const awayInnings = match.innings.filter((i) => i.teamId === match.awayTeamId);
      const homeRuns = homeInnings.reduce((sum, i) => sum + i.runs, 0);
      const awayRuns = awayInnings.reduce((sum, i) => sum + i.runs, 0);
      score = `${homeRuns} - ${awayRuns}`;
    }

    return `${status} | ${home} ${score} ${away} | ${match.format.toUpperCase()} | ${match.venue}`;
  }

  static formatMatches(matches: CricketMatch[], teams?: Map<string, CricketTeam>): string {
    if (matches.length === 0) return 'No matches found.';
    return matches.map((m, i) => {
      const home = teams?.get(m.homeTeamId);
      const away = teams?.get(m.awayTeamId);
      return `${i + 1}. ${this.formatMatch(m, home, away)}`;
    }).join('\n');
  }

  static formatInnings(innings: CricketInnings): string {
    return `${innings.runs}/${innings.wickets} (${innings.overs} ov) | RR: ${innings.runRate.toFixed(2)}`;
  }

  static formatPrediction(prediction: CricketPrediction, homeTeam?: string, awayTeam?: string): string {
    const parts: string[] = [];
    parts.push(`## ${homeTeam ?? 'Home'} vs ${awayTeam ?? 'Away'}`);
    parts.push(`\nWin Probability:`);
    parts.push(`  ${homeTeam ?? 'Home'}: ${(prediction.homeWinProb * 100).toFixed(1)}%`);
    parts.push(`  ${awayTeam ?? 'Away'}: ${(prediction.awayWinProb * 100).toFixed(1)}%`);

    if (prediction.drawProb > 0) {
      parts.push(`  Draw: ${(prediction.drawProb * 100).toFixed(1)}%`);
    }

    parts.push(`\nToss Impact: ${prediction.tossImpact}`);
    parts.push(`Pitch Condition: ${prediction.pitchCondition}`);

    if (prediction.factors.length > 0) {
      parts.push(`\nFactors:`);
      for (const factor of prediction.factors) {
        parts.push(`  - ${factor}`);
      }
    }

    return parts.join('\n');
  }

  static formatNRR(teamId: string, nrr: number): string {
    const sign = nrr >= 0 ? '+' : '';
    return `${teamId}: ${sign}${nrr.toFixed(3)} NRR`;
  }
}
