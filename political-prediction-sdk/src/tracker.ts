/**
 * PoliticalPrediction — political prediction market tracking, election forecasts, policy impact
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import type { PoliticalMarket, OutcomePrice, ElectionForecast, CandidateForecast, PolicyImpact, PoliticalSentiment, PoliticalMarketType, PoliticalParty } from "./types.js";

export interface PoliticalPredictionConfig extends BaseSDKConfig {
  sources?: string[];
  defaultSource?: string;
}

export class PoliticalPredictionTracker extends BaseSDK {
  private readonly sources: string[];
  private readonly defaultSource: string;

  constructor(config: PoliticalPredictionConfig) {
    super(config, "PoliticalPrediction");
    this.sources = config.sources || ["predictit", "polymarket"];
    this.defaultSource = config.defaultSource || "predictit";
  }

  async getMarkets(type?: PoliticalMarketType): Promise<PoliticalMarket[]> {
    const markets: PoliticalMarket[] = [];
    for (const source of this.sources) {
      const results = await this.fetchMarkets(source, type).catch(() => [] as PoliticalMarket[]);
      markets.push(...results);
    }
    return markets;
  }

  async getMarket(marketId: string): Promise<PoliticalMarket | null> {
    for (const source of this.sources) {
      const market = await this.fetchMarket(source, marketId).catch(() => null);
      if (market) return market;
    }
    return null;
  }

  async getElectionForecast(electionId: string): Promise<ElectionForecast | null> {
    const markets = await this.getMarkets(PoliticalMarketType.ELECTION_WINNER);
    const electionMarkets = markets.filter(m => m.title.toLowerCase().includes(electionId.toLowerCase()));
    if (electionMarkets.length === 0) return null;
    const candidates: CandidateForecast[] = [];
    for (const market of electionMarkets) {
      for (const outcome of market.outcomePrices) {
        candidates.push({ name: outcome.outcome, party: this.inferParty(outcome.outcome), winProbability: outcome.impliedProbability, voteShareProbability: outcome.impliedProbability, odds: outcome.price, trend: outcome.change24h > 0 ? "rising" : outcome.change24h < 0 ? "falling" : "stable", volume: outcome.volume, lastUpdated: market.updatedAt });
      }
    }
    return { election: electionId, date: electionMarkets[0]?.endDate || 0, candidates, totalVolume: electionMarkets.reduce((s, m) => s + m.volume, 0), lastUpdated: Date.now(), source: this.defaultSource };
  }

  async analyzePolicyImpact(policy: string): Promise<PolicyImpact[]> {
    const impacts: PolicyImpact[] = [];
    const policyLower = policy.toLowerCase();
    if (policyLower.includes("crypto") || policyLower.includes("bitcoin") || policyLower.includes("digital asset")) {
      impacts.push({ policy: "Crypto Regulation", description: "Potential cryptocurrency regulation", probability: 0.4, affectedSectors: ["crypto", "exchanges", "defi"], affectedTokens: ["BTC", "ETH", "UNI", "AAVE"], expectedImpact: -0.15, timeframe: "6-12 months", confidence: 0.6 });
    }
    if (policyLower.includes("ai") || policyLower.includes("artificial intelligence")) {
      impacts.push({ policy: "AI Regulation", description: "AI-related policy changes", probability: 0.5, affectedSectors: ["ai", "tech", "compute"], affectedTokens: ["FET", "OCEAN", "RNDR", "AGIX"], expectedImpact: 0.1, timeframe: "3-6 months", confidence: 0.5 });
    }
    if (policyLower.includes("interest rate") || policyLower.includes("fed") || policyLower.includes("monetary")) {
      impacts.push({ policy: "Monetary Policy", description: "Federal Reserve interest rate decisions", probability: 0.8, affectedSectors: ["all", "bonds", "equities", "crypto"], affectedTokens: ["BTC", "ETH", "USDC", "USDT"], expectedImpact: -0.05, timeframe: "1-3 months", confidence: 0.7 });
    }
    return impacts;
  }

  async getPoliticalSentiment(topic: string): Promise<PoliticalSentiment[]> {
    const markets = await this.getMarkets();
    const relevant = markets.filter(m => m.title.toLowerCase().includes(topic.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(topic.toLowerCase())));
    return relevant.map(m => {
      const avgPrice = m.outcomePrices.reduce((s, o) => s + o.price, 0) / Math.max(1, m.outcomePrices.length);
      return { topic: m.title, sentiment: avgPrice > 0.5 ? (avgPrice - 0.5) * 2 : (0.5 - avgPrice) * -2, volume: m.volume, trending: m.volume24h > m.volume * 0.1, sources: [m.source], timestamp: m.updatedAt };
    });
  }

  async getTrendingPoliticalTopics(limit = 10): Promise<{ topic: string; volume: number; change24h: number; sentiment: number }[]> {
    const markets = await this.getMarkets();
    const topicMap = new Map<string, { volume: number; change24h: number; sentiment: number; count: number }>();
    for (const market of markets) {
      for (const tag of market.tags) {
        const existing = topicMap.get(tag) || { volume: 0, change24h: 0, sentiment: 0, count: 0 };
        existing.volume += market.volume;
        existing.change24h += market.volume24h;
        existing.sentiment += market.outcomePrices[0]?.price || 0.5;
        existing.count++;
        topicMap.set(tag, existing);
      }
    }
    return [...topicMap.entries()].map(([topic, data]) => ({ topic, volume: data.volume, change24h: data.change24h, sentiment: data.sentiment / data.count })).sort((a, b) => b.volume - a.volume).slice(0, limit);
  }

  async compareSources(marketId: string): Promise<{ source: string; market: PoliticalMarket | null; priceDiff: number }[]> {
    const results: { source: string; market: PoliticalMarket | null; priceDiff: number }[] = [];
    let baselinePrice = 0;
    for (const source of this.sources) {
      const market = await this.fetchMarket(source, marketId).catch(() => null);
      if (market) {
        const avgPrice = market.outcomePrices.reduce((s, o) => s + o.price, 0) / Math.max(1, market.outcomePrices.length);
        if (baselinePrice === 0) baselinePrice = avgPrice;
        results.push({ source, market, priceDiff: avgPrice - baselinePrice });
      }
    }
    return results;
  }

  async getArbitrageOpportunities(): Promise<{ market: PoliticalMarket; buyFrom: string; sellTo: string; spread: number; expectedProfit: number }[]> {
    const opportunities: { market: PoliticalMarket; buyFrom: string; sellTo: string; spread: number; expectedProfit: number }[] = [];
    const markets = await this.getMarkets();
    for (const market of markets) {
      if (market.outcomePrices.length < 2) continue;
      const sorted = [...market.outcomePrices].sort((a, b) => a.bestBid - b.bestAsk);
      for (let i = 0; i < sorted.length - 1; i++) {
        const spread = sorted[i + 1]!.bestBid - sorted[i]!.bestAsk;
        if (spread > 0.02) {
          opportunities.push({ market, buyFrom: sorted[i]!.outcome, sellTo: sorted[i + 1]!.outcome, spread, expectedProfit: spread * market.volume * 0.001 });
        }
      }
    }
    return opportunities.sort((a, b) => b.spread - a.spread);
  }

  private async fetchMarkets(source: string, type?: PoliticalMarketType): Promise<PoliticalMarket[]> {
    if (source === "predictit") return this.fetchPredictItMarkets(type);
    if (source === "polymarket") return this.fetchPolymarketMarkets(type);
    return [];
  }

  private async fetchMarket(source: string, marketId: string): Promise<PoliticalMarket | null> {
    const markets = await this.fetchMarkets(source);
    return markets.find(m => m.id === marketId) || null;
  }

  private async fetchPredictItMarkets(type?: PoliticalMarketType): Promise<PoliticalMarket[]> {
    try {
      const data = await this.request<{ data: Record<string, unknown>[] }>("https://www.predictit.org/api/marketdata/all/");
      return (data.data || []).filter(m => !type || m.marketType === type).map(m => this.parsePredictItMarket(m));
    } catch { return []; }
  }

  private async fetchPolymarketMarkets(type?: PoliticalMarketType): Promise<PoliticalMarket[]> {
    try {
      const data = await this.request<{ data: Record<string, unknown>[] }>("https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=100");
      return (data.data || []).map(m => this.parsePolymarketMarket(m));
    } catch { return []; }
  }

  private parsePredictItMarket(raw: Record<string, unknown>): PoliticalMarket {
    const contracts = raw.contracts as Record<string, unknown>[] || [];
    return { id: String(raw.id || ""), title: (raw.name as string) || "", description: (raw.shortName as string) || "", type: PoliticalMarketType.ELECTION_WINNER, source: "predictit", outcomePrices: contracts.map(c => ({ outcome: (c.shortName as string) || "", price: ((c.bestBuyYesCost as number) || 0), impliedProbability: ((c.bestBuyYesCost as number) || 0), change24h: 0, volume: (c.volume as number) || 0, bestBid: ((c.bestSellYesCost as number) || 0), bestAsk: ((c.bestBuyYesCost as number) || 0) })), volume: (raw.volume as number) || 0, volume24h: (raw.volume24hr as number) || 0, liquidity: 0, endDate: new Date(raw.endDate as string || Date.now()).getTime(), resolutionCriteria: "", imageUrl: (raw.image as string) || "", tags: ((raw.tags as Record<string, string>[]) || []).map(t => t.name || ""), status: raw.status === "Open" ? "open" : "closed", createdAt: Date.now(), updatedAt: Date.now() };
  }

  private parsePolymarketMarket(raw: Record<string, unknown>): PoliticalMarket {
    const outcomes = raw.outcomes as string[] || [];
    const prices = raw.outcomePrices as string[] || [];
    return { id: String(raw.id || raw.conditionId || ""), title: (raw.question as string) || "", description: (raw.description as string) || "", type: PoliticalMarketType.POLICY_OUTCOME, source: "polymarket", outcomePrices: outcomes.map((o, i) => ({ outcome: o, price: parseFloat(prices[i] || "0.5"), impliedProbability: parseFloat(prices[i] || "0.5"), change24h: 0, volume: 0, bestBid: parseFloat(prices[i] || "0.5"), bestAsk: parseFloat(prices[i] || "0.5") })), volume: (raw.volume as number) || 0, volume24h: (raw.volume24hr as number) || 0, liquidity: (raw.liquidity as number) || 0, endDate: new Date(raw.endDateIso as string || Date.now()).getTime(), resolutionCriteria: (raw.resolutionCriteria as string) || "", imageUrl: (raw.image as string) || "", tags: (raw.tags as string[]) || [], status: raw.closed ? "closed" : "open", createdAt: Date.now(), updatedAt: Date.now() };
  }

  private inferParty(name: string): PoliticalParty {
    const lower = name.toLowerCase();
    if (lower.includes("democrat") || lower.includes("biden") || lower.includes("harris") || lower.includes("newsom")) return PoliticalParty.DEMOCRAT;
    if (lower.includes("republican") || lower.includes("trump") || lower.includes("desantis") || lower.includes("vance")) return PoliticalParty.REPUBLICAN;
    if (lower.includes("libertarian") || lower.includes("jorgensen")) return PoliticalParty.LIBERTARIAN;
    if (lower.includes("green") || lower.includes("stein")) return PoliticalParty.GREEN;
    return PoliticalParty.OTHER;
  }
}
