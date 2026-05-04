import { MarketType } from '../types.js';
import type { FifaNamespace } from '../sdk.js';

export interface ResolutionCriteria {
  marketType: MarketType;
  teamId?: string;
  fixtureId?: string;
  description: string;
  requiredOutcome: string;
}

/** Maps market questions to their FIFA tournament resolution criteria. */
export class ResolutionMapper {
  constructor(private readonly fifa: FifaNamespace) {}

  /** Map a market type and team to its resolution condition. */
  async map(input: { marketType: MarketType; teamId?: string; fixtureId?: string }): Promise<ResolutionCriteria> {
    const { marketType, teamId, fixtureId } = input;

    const descriptions: Record<MarketType, string> = {
      MATCH_WINNER: 'Team must win the specified match (not draw)',
      GROUP_WINNER: 'Team must finish 1st in their group',
      QUALIFICATION: 'Team must advance from the group stage (top 2)',
      REACH_R16: 'Team must reach the Round of 16',
      REACH_QF: 'Team must reach the Quarterfinal',
      REACH_SF: 'Team must reach the Semifinal',
      REACH_FINAL: 'Team must reach the Final',
      TOURNAMENT_WINNER: 'Team must win the FIFA World Cup 2026',
      TOP_SCORER: 'Player must be the tournament top scorer',
    };

    return {
      marketType,
      teamId,
      fixtureId,
      description: descriptions[marketType] ?? 'Unknown market type',
      requiredOutcome: marketType,
    };
  }
}
