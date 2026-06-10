/**
 * Manifold — play-money prediction market integration for backtesting sandbox
 * Calibration data, Brier scoring, market creation, bet placement
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface ManifoldMarket { id: string; question: string; description: string; creatorId: string; creatorName: string; outcomeType: "BINARY" | "MULTIPLE_CHOICE" | "FREE_RESPONSE" | "NUMERIC"; outcomeProb: number; liquidity: number; volume24h: number; volumeTotal: number; closeTime: number; isResolved: boolean; resolution?: string; answers?: ManifoldAnswer[]; createdTime: number }
export interface ManifoldAnswer { id: string; text: string; prob: number; poolYes: number; poolNo: number; index: number }
export interface ManifoldBet { id: string; marketId: string; userId: string; amount: number; outcome: string; shares: number; probBefore: number; probAfter: number; createdTime: number }
export interface ManifoldUser { id: string; name: string; username: string; balance: number; totalDeposits: number; profitCached: number; creatorVolumeCached: number; bio?: string }
export interface ManifoldConfig extends BaseSDKConfig { apiKey?: string; apiUrl?: string }

export class ManifoldClient extends BaseSDK {
  private readonly apiUrl: string;
  private readonly apiKey?: string;

  constructor(config: ManifoldConfig) {
    super(config, "Manifold");
    this.apiUrl = config.apiUrl || "https://manifold.markets/api/v0";
    this.apiKey = config.apiKey;
  }

  async getMarkets(limit = 50, beforeId?: string, closeTime?: { min?: number; max?: number }, order = "volume24hr" as const, ascending = false): Promise<ManifoldMarket[]> {
    const params = new URLSearchParams({ limit: String(limit), order, ascending: String(ascending) });
    if (beforeId) params.set("before", beforeId);
    if (closeTime?.min) params.set("closeTimeMin", String(closeTime.min));
    if (closeTime?.max) params.set("closeTimeMax", String(closeTime.max));
    const data = await this.request<Record<string, unknown>[]>(`${this.apiUrl}/markets?${params}`);
    return data.map(m => this.parseMarket(m));
  }

  async getMarket(marketId: string): Promise<ManifoldMarket | null> {
    try { return this.parseMarket(await this.request<Record<string, unknown>>(`${this.apiUrl}/market/${marketId}`)); } catch { return null; }
  }

  async getMarketBySlug(slug: string): Promise<ManifoldMarket | null> {
    try { return this.parseMarket(await this.request<Record<string, unknown>>(`${this.apiUrl}/slug/${slug}`)); } catch { return null; }
  }

  async searchMarkets(query: string): Promise<ManifoldMarket[]> {
    const data = await this.request<Record<string, unknown>[]>(`${this.apiUrl}/search-markets?query=${encodeURIComponent(query)}`);
    return data.map(m => this.parseMarket(m));
  }

  async createBet(marketId: string, amount: number, outcome: string): Promise<ManifoldBet> {
    const data = await this.request<Record<string, unknown>>(`${this.apiUrl}/bet`, { method: "POST", body: JSON.stringify({ contractId: marketId, amount, outcome }), headers: this.authHeaders() });
    return this.parseBet(data);
  }

  async getBets(marketId?: string, userId?: string): Promise<ManifoldBet[]> {
    const params = new URLSearchParams(); if (marketId) params.set("contractId", marketId); if (userId) params.set("userId", userId);
    const data = await this.request<Record<string, unknown>[]>(`${this.apiUrl}/bets?${params}`);
    return data.map(b => this.parseBet(b));
  }

  async getUser(usernameOrId: string): Promise<ManifoldUser | null> {
    try { return this.parseUser(await this.request<Record<string, unknown>>(`${this.apiUrl}/user/${usernameOrId}`)); } catch { return null; }
  }

  async getUserBets(username: string): Promise<ManifoldBet[]> {
    const data = await this.request<Record<string, unknown>[]>(`${this.apiUrl}/bets?username=${username}`);
    return data.map(b => this.parseBet(b));
  }

  calculateBrierScore(outcomes: { predicted: number; actual: number }[]): number {
    if (outcomes.length === 0) return 0;
    const sum = outcomes.reduce((s, o) => s + Math.pow(o.predicted - o.actual, 2), 0);
    return sum / outcomes.length;
  }

  calculateCalibration(bins: { predicted: number; actual: number; count: number }[]): { calibrationError: number; buckets: { predicted: number; actual: number; count: number; error: number }[] } {
    const buckets = bins.map(b => ({ ...b, error: Math.abs(b.predicted - b.actual) }));
    const totalCount = buckets.reduce((s, b) => s + b.count, 0);
    const calibrationError = totalCount > 0 ? buckets.reduce((s, b) => s + b.error * b.count, 0) / totalCount : 0;
    return { calibrationError, buckets };
  }

  calculateExpectedValue(probability: number, marketProbability: number, amount: number): { ev: number; edge: number; kelly: number } {
    const edge = probability - marketProbability;
    const ev = amount * (probability * (1 / marketProbability - 1) - (1 - probability));
    const kelly = marketProbability > 0 && marketProbability < 1 ? (probability * (1 / marketProbability) - 1) / (1 / marketProbability - 1) : 0;
    return { ev, edge, kelly: Math.max(0, kelly) };
  }

  async getTrendingMarkets(): Promise<ManifoldMarket[]> {
    const markets = await this.getMarkets(20, undefined, undefined, "volume24hr");
    return markets.filter(m => m.volume24h > 100).sort((a, b) => b.volume24h - a.volume24h);
  }

  async getMyPositions(userId: string): Promise<{ market: ManifoldMarket; shares: number; avgPrice: number; currentValue: number; profit: number }[]> {
    const bets = await this.getBets(undefined, userId);
    const marketGroups = new Map<string, ManifoldBet[]>();
    for (const bet of bets) { if (!marketGroups.has(bet.marketId)) marketGroups.set(bet.marketId, []); marketGroups.get(bet.marketId)!.push(bet); }
    const positions: { market: ManifoldMarket; shares: number; avgPrice: number; currentValue: number; profit: number }[] = [];
    for (const [marketId, marketBets] of marketGroups) {
      const market = await this.getMarket(marketId);
      if (!market) continue;
      const YESShares = marketBets.filter(b => b.outcome === "YES").reduce((s, b) => s + b.shares, 0);
      const NOShares = marketBets.filter(b => b.outcome === "NO").reduce((s, b) => s + b.shares, 0);
      const totalCost = marketBets.reduce((s, b) => s + b.amount, 0);
      const shares = Math.abs(YESShares - NOShares);
      const currentValue = shares * market.outcomeProb;
      positions.push({ market, shares, avgPrice: shares > 0 ? totalCost / shares : 0, currentValue, profit: currentValue - totalCost });
    }
    return positions;
  }

  async createMarket(question: string, description: string, outcomeType: "BINARY" = "BINARY", closeTime?: number): Promise<ManifoldMarket> {
    const data = await this.request<Record<string, unknown>>(`${this.apiUrl}/market`, { method: "POST", body: JSON.stringify({ question, description, outcomeType, closeTime: closeTime || Date.now() + 30 * 86400000 }), headers: this.authHeaders() });
    return this.parseMarket(data);
  }

  async addLiquidity(marketId: string, amount: number): Promise<{ status: string }> {
    return this.request<{ status: string }>(`${this.apiUrl}/market/${marketId}/add-liquidity`, { method: "POST", body: JSON.stringify({ amount }), headers: this.authHeaders() });
  }

  private authHeaders(): Record<string, string> {
    return this.apiKey ? { "Authorization": `Key ${this.apiKey}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  }

  private parseMarket(raw: Record<string, unknown>): ManifoldMarket {
    const answers = (raw.answers as Record<string, unknown>[] || []).map((a, i) => ({ id: String(a.id || i), text: String(a.text || ""), prob: (a.prob as number) || 0, poolYes: (a.poolYes as number) || 0, poolNo: (a.poolNo as number) || 0, index: i }));
    return { id: (raw.id as string) || "", question: (raw.question as string) || "", description: (raw.textDescription as string) || "", creatorId: (raw.creatorId as string) || "", creatorName: (raw.creatorUsername as string) || "", outcomeType: ((raw.outcomeType as string) || "BINARY") as ManifoldMarket["outcomeType"], outcomeProb: (raw.probability as number) || 0.5, liquidity: (raw.totalLiquidity as number) || 0, volume24h: (raw.volume24Hours as number) || 0, volumeTotal: (raw.volume as number) || 0, closeTime: (raw.closeTime as number) || Date.now() + 30 * 86400000, isResolved: (raw.isResolved as boolean) || false, resolution: raw.resolution as string | undefined, answers, createdTime: (raw.createdTime as number) || Date.now() };
  }

  private parseBet(raw: Record<string, unknown>): ManifoldBet {
    return { id: (raw.id as string) || "", marketId: (raw.contractId as string) || "", userId: (raw.userId as string) || "", amount: (raw.amount as number) || 0, outcome: String(raw.outcome || ""), shares: (raw.shares as number) || 0, probBefore: (raw.probBefore as number) || 0, probAfter: (raw.probAfter as number) || 0, createdTime: (raw.createdTime as number) || Date.now() };
  }

  private parseUser(raw: Record<string, unknown>): ManifoldUser {
    return { id: (raw.id as string) || "", name: (raw.name as string) || "", username: (raw.username as string) || "", balance: (raw.balance as number) || 0, totalDeposits: (raw.totalDeposits as number) || 0, profitCached: (raw.profitCached as number) || 0, creatorVolumeCached: (raw.creatorVolumeCached as number) || 0, bio: raw.bio as string | undefined };
  }
}
