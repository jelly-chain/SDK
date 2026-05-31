import { MarketType } from '../types.js';

export interface ParsedMarketQuestion {
  raw: string;
  marketType: MarketType;
  extractedTeams: string[];
  extractedGroup?: string;
  extractedTournament: string;
  confidence: number;
}

const MARKET_TYPE_PATTERNS: Array<{ pattern: RegExp; type: MarketType }> = [
  { pattern: /win.*world cup|tournament winner|champion/i, type: 'TOURNAMENT_WINNER' },
  { pattern: /win group [a-l]/i, type: 'GROUP_WINNER' },
  { pattern: /qualify|advance|qualify from group/i, type: 'QUALIFICATION' },
  { pattern: /reach.*round of 16|make.*r16/i, type: 'REACH_R16' },
  { pattern: /reach.*quarter.?final/i, type: 'REACH_QF' },
  { pattern: /reach.*semi.?final/i, type: 'REACH_SF' },
  { pattern: /reach.*final|make.*the final/i, type: 'REACH_FINAL' },
  { pattern: /top scorer|golden boot/i, type: 'TOP_SCORER' },
  { pattern: /win|beat|defeat|match winner/i, type: 'MATCH_WINNER' },
];

const TEAM_NAMES: Record<string, string> = {
  brazil: 'team-brazil',
  argentina: 'team-argentina',
  france: 'team-france',
  england: 'team-england',
  germany: 'team-germany',
  spain: 'team-spain',
  portugal: 'team-portugal',
  netherlands: 'team-netherlands',
  usa: 'team-usa',
  mexico: 'team-mexico',
};

/** Parses natural-language prediction market questions into structured objects. */
export class MarketQuestionParser {
  parse(question: string): ParsedMarketQuestion {
    const marketType = this.detectMarketType(question);
    const extractedTeams = this.extractTeams(question);
    const extractedGroup = this.extractGroup(question);

    return {
      raw: question,
      marketType,
      extractedTeams,
      extractedGroup,
      extractedTournament: 'fifa-wc-2026',
      confidence: extractedTeams.length > 0 ? 0.8 : 0.5,
    };
  }

  private detectMarketType(question: string): MarketType {
    for (const { pattern, type } of MARKET_TYPE_PATTERNS) {
      if (pattern.test(question)) return type;
    }
    return 'MATCH_WINNER';
  }

  private extractTeams(question: string): string[] {
    const lower = question.toLowerCase();
    return Object.entries(TEAM_NAMES)
      .filter(([name]) => lower.includes(name))
      .map(([, id]) => id);
  }

  private extractGroup(question: string): string | undefined {
    const match = question.match(/group ([a-l])/i);
    return match ? `wc26-group-${match[1].toLowerCase()}` : undefined;
  }
}
