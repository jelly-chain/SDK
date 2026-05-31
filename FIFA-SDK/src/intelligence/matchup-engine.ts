import { FormRecord } from '../types.js';
import type { FifaNamespace } from '../sdk.js';
import { FormEngine } from './form-engine.js';

export interface MatchupContext {
  homeTeamId: string;
  awayTeamId: string;
  tournament: string;
  homeForm: FormRecord;
  awayForm: FormRecord;
  headToHead: {
    homeWins: number;
    awayWins: number;
    draws: number;
    homeGoals: number;
    awayGoals: number;
  };
  narrativeTags: string[];
  favoredTeamId?: string;
  favorStrength: 'slight' | 'moderate' | 'strong' | 'even';
}

/** Builds head-to-head matchup context for prediction. */
export class MatchupEngine {
  private formEngine: FormEngine;

  constructor(private readonly fifa: FifaNamespace) {
    this.formEngine = new FormEngine(fifa);
  }

  /** Compare two teams and return structured matchup context. */
  async compare(input: { homeTeam: string; awayTeam: string; tournament?: string }): Promise<MatchupContext> {
    const { homeTeam, awayTeam, tournament = 'fifa-wc-2026' } = input;

    const [homeForm, awayForm, h2h] = await Promise.all([
      this.formEngine.team(homeTeam),
      this.formEngine.team(awayTeam),
      this.fifa.history.headToHead(homeTeam, awayTeam),
    ]);

    const diff = homeForm.formRating - awayForm.formRating;
    let favoredTeamId: string | undefined;
    let favorStrength: MatchupContext['favorStrength'] = 'even';

    if (Math.abs(diff) < 0.05) {
      favorStrength = 'even';
    } else if (Math.abs(diff) < 0.15) {
      favorStrength = 'slight';
      favoredTeamId = diff > 0 ? homeTeam : awayTeam;
    } else if (Math.abs(diff) < 0.3) {
      favorStrength = 'moderate';
      favoredTeamId = diff > 0 ? homeTeam : awayTeam;
    } else {
      favorStrength = 'strong';
      favoredTeamId = diff > 0 ? homeTeam : awayTeam;
    }

    const narrativeTags: string[] = [];
    if (h2h.teamAWins + h2h.teamBWins + h2h.draws === 0) narrativeTags.push('first-wc-meeting');
    if (homeForm.results.slice(0, 3).every(r => r === 'W')) narrativeTags.push('home-hot-streak');
    if (awayForm.results.slice(0, 3).every(r => r === 'W')) narrativeTags.push('away-hot-streak');

    return {
      homeTeamId: homeTeam,
      awayTeamId: awayTeam,
      tournament,
      homeForm,
      awayForm,
      headToHead: {
        homeWins: h2h.teamAWins,
        awayWins: h2h.teamBWins,
        draws: h2h.draws,
        homeGoals: h2h.teamAGoals,
        awayGoals: h2h.teamBGoals,
      },
      narrativeTags,
      favoredTeamId,
      favorStrength,
    };
  }
}
