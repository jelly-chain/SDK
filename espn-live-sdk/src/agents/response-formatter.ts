/**
 * Format ESPN data for agent-friendly output
 */

import type { EspnScore, EspnStanding, EspnTeam } from '../types.js';

export class ResponseFormatter {
  static formatScore(score: EspnScore): string {
    const status = score.status === 'in' ? '🔴 LIVE' : score.status === 'post' ? '✅ Final' : '⏰ Scheduled';
    const period = score.period ? ` | Period ${score.period}` : '';
    const clock = score.displayClock ? ` ${score.displayClock}` : '';
    return `${status} | ${score.awayTeam.displayName} ${score.awayTeam.score} - ${score.homeTeam.score} ${score.homeTeam.displayName}${period}${clock}`;
  }

  static formatScores(scores: EspnScore[]): string {
    if (scores.length === 0) return 'No games found.';
    return scores.map((s, i) => `${i + 1}. ${this.formatScore(s)}`).join('\n');
  }

  static formatStanding(standing: EspnStanding): string {
    return `${standing.rank}. ${standing.team.displayName} — ${standing.wins}-${standing.losses}${standing.ties ? `-${standing.ties}` : ''} (${(standing.winPercent * 100).toFixed(1)}%)`;
  }

  static formatStandings(standings: EspnStanding[]): string {
    if (standings.length === 0) return 'No standings available.';
    return standings.map((s) => this.formatStanding(s)).join('\n');
  }

  static formatTeam(team: EspnTeam): string {
    return `${team.displayName} (${team.abbreviation})${team.record ? ` — ${team.record}` : ''}`;
  }

  static formatTeams(teams: EspnTeam[]): string {
    if (teams.length === 0) return 'No teams found.';
    return teams.map((t, i) => `${i + 1}. ${this.formatTeam(t)}`).join('\n');
  }
}
