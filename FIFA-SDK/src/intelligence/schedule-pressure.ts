import type { FifaNamespace } from '../sdk.js';

export interface SchedulePressureReport {
  teamId: string;
  daysUntilNextMatch?: number;
  restAdvantage?: number;
  travelDistanceKm?: number;
  pressureScore: number;
  pressureFlags: string[];
}

/** Evaluates schedule and travel pressure on a team before a fixture. */
export class SchedulePressure {
  constructor(private readonly fifa: FifaNamespace) {}

  /** Estimate schedule pressure for a team heading into their next match. */
  async evaluate(teamId: string, fixtureId?: string): Promise<SchedulePressureReport> {
    const upcoming = await this.fifa.fixtures.upcoming(teamId);
    const next = upcoming[0];

    const pressureFlags: string[] = [];
    let daysUntilNextMatch: number | undefined;

    if (next) {
      const now = Date.now();
      const kickoff = new Date(next.kickoffUtc).getTime();
      daysUntilNextMatch = Math.floor((kickoff - now) / 86400000);
      if (daysUntilNextMatch <= 3) pressureFlags.push('short-turnaround');
    }

    const pressureScore = pressureFlags.length / 3;
    return { teamId, daysUntilNextMatch, pressureScore, pressureFlags };
  }
}
