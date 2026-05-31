/**
 * Format Sportradar data for agent-friendly output
 */

import type { SportradarMatch, SportradarStanding, SportradarInjury } from '../types.js';

export class ResponseFormatter {
  static formatMatch(match: SportradarMatch): string {
    const status = match.status === 'live' ? '🔴 LIVE' : match.status === 'finished' ? '✅ Final' : '⏰ Scheduled';
    const score = match.home_score !== undefined ? `${match.home_score} - ${match.away_score}` : 'vs';
    return `${status} | ${match.home.name} ${score} ${match.away.name} | ${match.venue?.name ?? 'TBD'}`;
  }

  static formatMatches(matches: SportradarMatch[]): string {
    if (matches.length === 0) return 'No matches found.';
    return matches.map((m, i) => `${i + 1}. ${this.formatMatch(m)}`).join('\n');
  }

  static formatStandings(standings: SportradarStanding[]): string {
    if (standings.length === 0) return 'No standings available.';
    const header = 'Pos | Team | P | W | D | L | GD | Pts';
    const rows = standings.map((s) =>
      `${s.position} | ${s.competitor_name} | ${s.played} | ${s.won} | ${s.drawn} | ${s.lost} | ${s.goal_diff > 0 ? '+' : ''}${s.goal_diff} | ${s.points}`
    );
    return [header, ...rows].join('\n');
  }

  static formatInjuries(injuries: SportradarInjury[]): string {
    if (injuries.length === 0) return 'No injury reports available.';
    return injuries.map((inj) =>
      `⚠️ ${inj.player_name} (${inj.team_name}) — ${inj.type}: ${inj.detail} | Status: ${inj.status}`
    ).join('\n');
  }

  static formatForPrediction(data: {
    match: SportradarMatch;
    standings?: SportradarStanding[];
    injuries?: SportradarInjury[];
  }): string {
    const parts: string[] = [];
    parts.push(`## Match: ${data.match.home.name} vs ${data.match.away.name}`);
    parts.push(`Status: ${data.match.status}`);
    parts.push(`Venue: ${data.match.venue?.name ?? 'TBD'}`);
    parts.push(`Scheduled: ${data.match.scheduled}`);

    if (data.standings && data.standings.length > 0) {
      parts.push('\n### Standings');
      const homeStanding = data.standings.find((s) => s.competitor_name === data.match.home.name);
      const awayStanding = data.standings.find((s) => s.competitor_name === data.match.away.name);
      if (homeStanding) parts.push(`${data.match.home.name}: Position ${homeStanding.position}, ${homeStanding.points} pts`);
      if (awayStanding) parts.push(`${data.match.away.name}: Position ${awayStanding.position}, ${awayStanding.points} pts`);
    }

    if (data.injuries && data.injuries.length > 0) {
      parts.push('\n### Injuries');
      parts.push(this.formatInjuries(data.injuries));
    }

    return parts.join('\n');
  }
}
