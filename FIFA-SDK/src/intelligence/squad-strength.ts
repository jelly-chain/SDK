import type { FifaNamespace } from '../sdk.js';

export interface SquadStrengthReport {
  teamId: string;
  overallRating: number;
  availabilityRatio: number;
  depthScore: number;
  strengthTier: 'elite' | 'strong' | 'average' | 'weak';
}

/** Estimates squad strength based on availability, depth, and FIFA ranking. */
export class SquadStrength {
  constructor(private readonly fifa: FifaNamespace) {}

  /** Calculate a squad strength report for a team. */
  async evaluate(teamId: string): Promise<SquadStrengthReport> {
    const [team, squad, available] = await Promise.all([
      this.fifa.teams.byId(teamId),
      this.fifa.squads.byTeam(teamId),
      this.fifa.squads.available(teamId),
    ]);

    const availabilityRatio = squad.length > 0 ? available.length / squad.length : 1;
    const ranking = team.fifaRanking ?? 50;
    const overallRating = Math.max(0, 1 - ranking / 200) * availabilityRatio;
    const depthScore = Math.min(available.length / 23, 1);

    let strengthTier: SquadStrengthReport['strengthTier'];
    if (overallRating >= 0.75) strengthTier = 'elite';
    else if (overallRating >= 0.55) strengthTier = 'strong';
    else if (overallRating >= 0.35) strengthTier = 'average';
    else strengthTier = 'weak';

    return { teamId, overallRating, availabilityRatio, depthScore, strengthTier };
  }
}
