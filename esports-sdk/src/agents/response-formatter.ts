/**
 * Format Esports data for agent-friendly output
 */

import type { EsportMatch, EsportTeam, EsportTournament, EsportPrediction } from '../types.js';

export class ResponseFormatter {
  static formatMatch(match: EsportMatch, homeTeam?: EsportTeam, awayTeam?: EsportTeam): string {
    const home = homeTeam?.name ?? match.homeTeamId;
    const away = awayTeam?.name ?? match.awayTeamId;
    const status = match.status === 'live' ? '🔴 LIVE' : match.status === 'finished' ? '✅ Final' : '⏰ Scheduled';
    const score = match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'vs';
    return `${status} | ${home} ${score} ${away} | ${match.tournament} (Bo${match.bestOf})`;
  }

  static formatMatches(matches: EsportMatch[], teams?: Map<string, EsportTeam>): string {
    if (matches.length === 0) return 'No matches found.';
    return matches.map((m, i) => {
      const home = teams?.get(m.homeTeamId);
      const away = teams?.get(m.awayTeamId);
      return `${i + 1}. ${this.formatMatch(m, home, away)}`;
    }).join('\n');
  }

  static formatTournament(tournament: EsportTournament): string {
    return `🏆 ${tournament.name}\n   Title: ${tournament.title} | Tier: ${tournament.tier}\n   Teams: ${tournament.teams.length} | Dates: ${tournament.startDate} - ${tournament.endDate}`;
  }

  static formatPrediction(prediction: EsportPrediction, homeTeam?: EsportTeam, awayTeam?: EsportTeam): string {
    const home = homeTeam?.name ?? prediction.homeTeamId;
    const away = awayTeam?.name ?? prediction.awayTeamId;
    const parts: string[] = [];
    parts.push(`## ${home} vs ${away}`);
    parts.push(`\nWin Probability:`);
    parts.push(`  ${home}: ${(prediction.homeWinProb * 100).toFixed(1)}%`);
    parts.push(`  ${away}: ${(prediction.awayWinProb * 100).toFixed(1)}%`);
    parts.push(`\nMap Advantage: ${prediction.mapAdvantage}`);
    parts.push(`Confidence: ${(prediction.confidence * 100).toFixed(0)}%`);

    if (prediction.factors.length > 0) {
      parts.push(`\nFactors:`);
      for (const factor of prediction.factors) {
        parts.push(`  - ${factor}`);
      }
    }

    return parts.join('\n');
  }

  static formatForPolymarket(match: EsportMatch, homeTeam: EsportTeam, awayTeam: EsportTeam): {
    title: string;
    description: string;
    outcomes: string[];
  } {
    return {
      title: `${homeTeam.name} vs ${awayTeam.name}`,
      description: `${match.tournament} — Best of ${match.bestOf}`,
      outcomes: [homeTeam.name, awayTeam.name],
    };
  }
}
