import { MarketType } from '../../types.js';

export interface ResolutionCondition {
  marketType: MarketType;
  teamId?: string;
  requiredStage?: string;
  description: string;
  binaryOutcome: boolean;
}

/** Defines and evaluates how each market type resolves against tournament outcomes. */
export class MarketResolution {
  /** Return the resolution condition for a market type. */
  describe(marketType: MarketType, teamId?: string): ResolutionCondition {
    const base: Record<MarketType, Omit<ResolutionCondition, 'teamId'>> = {
      MATCH_WINNER: { marketType, requiredStage: 'match', description: 'Team wins the match', binaryOutcome: true },
      GROUP_WINNER: { marketType, requiredStage: 'group', description: 'Team finishes 1st in group', binaryOutcome: true },
      QUALIFICATION: { marketType, requiredStage: 'group', description: 'Team finishes top 2 in group', binaryOutcome: true },
      REACH_R16: { marketType, requiredStage: 'round-of-16', description: 'Team reaches Round of 16', binaryOutcome: true },
      REACH_QF: { marketType, requiredStage: 'quarterfinal', description: 'Team reaches Quarterfinal', binaryOutcome: true },
      REACH_SF: { marketType, requiredStage: 'semifinal', description: 'Team reaches Semifinal', binaryOutcome: true },
      REACH_FINAL: { marketType, requiredStage: 'final', description: 'Team reaches the Final', binaryOutcome: true },
      TOURNAMENT_WINNER: { marketType, requiredStage: 'final', description: 'Team wins the World Cup', binaryOutcome: true },
      TOP_SCORER: { marketType, description: 'Player wins Golden Boot', binaryOutcome: false },
    };
    return { ...base[marketType], teamId };
  }

  /** Check whether a team has met the resolution condition based on bracket data. */
  isResolved(condition: ResolutionCondition, teamCurrentStage?: string): boolean {
    if (!condition.requiredStage || !teamCurrentStage) return false;
    const stageOrder = ['group', 'round-of-16', 'quarterfinal', 'semifinal', 'final'];
    const required = stageOrder.indexOf(condition.requiredStage);
    const current = stageOrder.indexOf(teamCurrentStage);
    return current >= required;
  }
}
