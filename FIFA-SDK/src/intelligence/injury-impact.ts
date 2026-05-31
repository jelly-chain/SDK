import { Player } from '../types.js';
import type { FifaNamespace } from '../sdk.js';

export interface InjurySummary {
  teamId: string;
  unavailablePlayers: Player[];
  impactScore: number;
  keyAbsences: string[];
  riskFlags: string[];
}

/** Evaluates the impact of injuries and suspensions on a team. */
export class InjuryImpact {
  constructor(private readonly fifa: FifaNamespace) {}

  /** Return a summary of unavailable players and an impact score (0 = no impact, 1 = severe). */
  async summary(teamId: string): Promise<InjurySummary> {
    const unavailable = await this.fifa.squads.unavailable(teamId);
    const impactScore = Math.min(unavailable.length / 5, 1);

    const keyAbsences = unavailable
      .filter(p => p.position === 'FWD' || p.position === 'MID')
      .map(p => p.name);

    const riskFlags: string[] = [];
    if (unavailable.filter(p => p.position === 'GK').length > 0) riskFlags.push('goalkeeper-unavailable');
    if (unavailable.length >= 4) riskFlags.push('multiple-absences');

    return { teamId, unavailablePlayers: unavailable, impactScore, keyAbsences, riskFlags };
  }
}
