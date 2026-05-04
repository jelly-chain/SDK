import { FormRecord } from '../types.js';
import type { FifaNamespace } from '../sdk.js';

/** Calculates recent team form based on match results. */
export class FormEngine {
  constructor(private readonly fifa: FifaNamespace) {}

  /**
   * Get recent form for a team over the last N matches.
   * Returns W/D/L results, goal stats, and a composite form rating (0-1).
   */
  async team(teamId: string, window = 5): Promise<FormRecord> {
    const recent = await this.fifa.fixtures.recentResults(teamId, window);

    const results: Array<'W' | 'D' | 'L'> = recent.map(f => {
      const isHome = f.homeTeamId === teamId;
      const scored = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      const conceded = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
      if (scored > conceded) return 'W';
      if (scored === conceded) return 'D';
      return 'L';
    });

    const wins = results.filter(r => r === 'W').length;
    const draws = results.filter(r => r === 'D').length;
    const formRating = results.length > 0 ? (wins * 3 + draws) / (results.length * 3) : 0.5;

    const goalsScored = recent.reduce((sum, f) => {
      return sum + (f.homeTeamId === teamId ? (f.homeScore ?? 0) : (f.awayScore ?? 0));
    }, 0);

    const goalsConceded = recent.reduce((sum, f) => {
      return sum + (f.homeTeamId === teamId ? (f.awayScore ?? 0) : (f.homeScore ?? 0));
    }, 0);

    return { teamId, window, results, goalsScored, goalsConceded, formRating };
  }
}
