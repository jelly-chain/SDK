/**
 * Referee Assignment Provider
 * Ref tendencies affect card/corner markets.
 */

import { AbstractProvider } from '../base-provider.js';

export interface RefereeConfig {
  enabled?: boolean;
  apiKey?: string;
}

export interface RefereeProfile {
  id: string;
  name: string;
  nationality: string;
  confederation: string;
  totalMatches: number;
  stats: {
    avgYellowCards: number;
    avgRedCards: number;
    avgPenalties: number;
    avgFouls: number;
    avgCorners: number;
    strictness: 'lenient' | 'moderate' | 'strict';
  };
  recentForm: {
    matches: number;
    avgCards: number;
    avgPenalties: number;
  };
}

export interface RefereeAssignment {
  fixtureId: string;
  referee: RefereeProfile;
  assistantReferees: string[];
  fourthOfficial?: string;
  var?: string;
}

export class RefereeClient extends AbstractProvider {
  override readonly name = 'RefereeProvider';
  override readonly enabled: boolean;
  private readonly apiKey: string;

  constructor(config: RefereeConfig = {}) {
    super();
    this.apiKey = config.apiKey ?? process.env['REFEREE_API_KEY'] ?? '';
    this.enabled = config.enabled !== false && this.apiKey.length > 0;
  }

  /** Get referee profile with stats */
  async getReferee(refereeId: string): Promise<RefereeProfile | null> {
    this.logRequest(`/referees/${refereeId}`);
    // In production, fetch from API
    return null;
  }

  /** Get assignment for a fixture */
  async getAssignment(fixtureId: string): Promise<RefereeAssignment | null> {
    this.logRequest(`/fixtures/${fixtureId}/referee`);
    return null;
  }

  /** Search referees by name */
  async search(query: string): Promise<RefereeProfile[]> {
    this.logRequest(`/referees?search=${encodeURIComponent(query)}`);
    return [];
  }

  /** Get ref card tendencies */
  async getCardTendencies(refereeId: string): Promise<{
    over2_5CardsRate: number;
    over4_5CardsRate: number;
    over6_5CardsRate: number;
    penaltyRate: number;
  }> {
    const ref = await this.getReferee(refereeId);
    if (!ref) {
      return { over2_5CardsRate: 0.5, over4_5CardsRate: 0.3, over6_5CardsRate: 0.15, penaltyRate: 0.25 };
    }
    return {
      over2_5CardsRate: Math.min(0.95, ref.stats.avgYellowCards / 2.5),
      over4_5CardsRate: Math.min(0.9, ref.stats.avgYellowCards / 4.5),
      over6_5CardsRate: Math.min(0.8, (ref.stats.avgYellowCards + ref.stats.avgRedCards) / 6.5),
      penaltyRate: ref.stats.avgPenalties,
    };
  }

  /** Analyze if a ref is card-friendly or card-averse */
  classifyStrictness(referee: RefereeProfile): {
    classification: string;
    avgCardsPerGame: number;
    bettingEdge: string;
  } {
    const avgCards = referee.stats.avgYellowCards + referee.stats.avgRedCards * 2;
    const classification = referee.stats.strictness;
    const bettingEdge =
      classification === 'strict'
        ? 'Consider overs on cards markets'
        : classification === 'lenient'
          ? 'Consider unders on cards markets'
          : 'Neutral — no clear edge';

    return { classification, avgCardsPerGame: avgCards, bettingEdge };
  }
}
