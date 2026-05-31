import { MarketType } from '../../types.js';

export interface MarketQuestionData {
  raw: string;
  marketType: MarketType;
  teamIds: string[];
  groupCode?: string;
  resolutionDescription: string;
}

/** Utility for parsing and describing prediction market questions. */
export class MarketQuestionHelper {
  constructor(public readonly data: MarketQuestionData) {}

  static describe(marketType: MarketType): string {
    const descriptions: Record<MarketType, string> = {
      MATCH_WINNER: 'Will a team win a specific match?',
      GROUP_WINNER: 'Will a team finish first in their group?',
      QUALIFICATION: 'Will a team advance from the group stage?',
      REACH_R16: 'Will a team reach the Round of 16?',
      REACH_QF: 'Will a team reach the Quarterfinal?',
      REACH_SF: 'Will a team reach the Semifinal?',
      REACH_FINAL: 'Will a team reach the Final?',
      TOURNAMENT_WINNER: 'Will a team win the FIFA World Cup 2026?',
      TOP_SCORER: 'Who will be the tournament top scorer?',
    };
    return descriptions[marketType] ?? 'Unknown market question type';
  }
}
