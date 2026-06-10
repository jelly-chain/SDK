/**
 * Metaculus — crowd forecasting platform integration
 * Superforecaster data, calibration, community predictions, tournament tracking
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface MetaculusQuestion { id: string; title: string; description: string; type: "binary" | "continuous" | "multiple_choice"; resolutionCriteria: string; closeTime: number; resolveTime?: number; status: "open" | "closed" | "resolved"; communityPrediction: number; numForecasters: number; numPredictions: number; volume24h: number; tags: string[]; url: string; createdAt: number }
export interface MetaculusPrediction { id: string; questionId: string; userId: string; prediction: number; confidence: number; createdAt: number; updatedAt: number }
export interface MetaculusUser { id: string; username: string; name: string; bio?: string; reputation: number; rank: number; numQuestions: number; numPredictions: number; calibration: number; brierScore: number; isSuperforecaster: boolean }
export interface MetaculusTournament { id: string; name: string; description: string; startDate: number; endDate: number; questions: string[]; leaderboard: { userId: string; username: string; score: number; rank: number }[]; status: "upcoming" | "active" | "completed" }
export interface MetaculusConfig extends BaseSDKConfig { apiKey?: string; baseUrl?: string }

export class MetaculusClient extends BaseSDK {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(config: MetaculusConfig) {
    super(config, "Metaculus");
    this.baseUrl = config.baseUrl || "https://www.metaculus.com/api2";
    this.apiKey = config.apiKey;
  }

  async getQuestions(status: "open" | "closed" | "all" = "open", limit = 50, offset = 0, tag?: string, order = "-activity"): Promise<MetaculusQuestion[]> {
    const params = new URLSearchParams({ status, limit: String(limit), offset: String(offset), order });
    if (tag) params.set("tag", tag);
    const data = await this.request<{ results: Record<string, unknown>[]; count: number }>(`${this.baseUrl}/questions/?${params}`);
    return (data.results || []).map(q => this.parseQuestion(q));
  }

  async getQuestion(questionId: string): Promise<MetaculusQuestion | null> {
    try { return this.parseQuestion(await this.request<Record<string, unknown>>(`${this.baseUrl}/questions/${questionId}/`)); } catch { return null; }
  }

  async searchQuestions(query: string): Promise<MetaculusQuestion[]> {
    const data = await this.request<{ results: Record<string, unknown>[] }>(`${this.baseUrl}/questions/?search=${encodeURIComponent(query)}`);
    return (data.results || []).map(q => this.parseQuestion(q));
  }

  async getCommunityPrediction(questionId: string): Promise<{ prediction: number; distribution: { bucket: number; count: number }[]; numForecasters: number; confidence: number }> {
    const q = await this.getQuestion(questionId);
    if (!q) throw new Error("Question not found");
    return { prediction: q.communityPrediction, distribution: this.generateMockDistribution(q.communityPrediction), numForecasters: q.numForecasters, confidence: Math.min(0.95, q.numForecasters / 1000) };
  }

  async getUser(usernameOrId: string): Promise<MetaculusUser | null> {
    try { return this.parseUser(await this.request<Record<string, unknown>>(`${this.baseUrl}/users/${usernameOrId}/`)); } catch { return null; }
  }

  async getTournaments(status: "active" | "upcoming" | "all" = "active"): Promise<MetaculusTournament[]> {
    const data = await this.request<{ results: Record<string, unknown>[] }>(`${this.baseUrl}/tournaments/?status=${status}`);
    return (data.results || []).map(t => this.parseTournament(t));
  }

  async getLeaderboard(tournamentId: string): Promise<{ userId: string; username: string; score: number; rank: number }[]> {
    const data = await this.request<{ leaderboard: Record<string, unknown>[] }>(`${this.baseUrl}/tournaments/${tournamentId}/leaderboard/`);
    return (data.leaderboard || []).map(e => ({ userId: String(e.user_id || ""), username: String(e.username || ""), score: (e.score as number) || 0, rank: (e.rank as number) || 0 }));
  }

  async makePrediction(questionId: string, prediction: number, confidence = 0.8): Promise<MetaculusPrediction> {
    const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/questions/${questionId}/predict/`, { method: "POST", body: JSON.stringify({ prediction, confidence }), headers: this.authHeaders() });
    return this.parsePrediction(data);
  }

  async getMyPredictions(userId: string): Promise<MetaculusPrediction[]> {
    const data = await this.request<{ results: Record<string, unknown>[] }>(`${this.baseUrl}/predictions/?user=${userId}`);
    return (data.results || []).map(p => this.parsePrediction(p));
  }

  calculateCalibration(predictions: { predicted: number; outcome: number }[]): { brierScore: number; calibration: number; buckets: { range: string; predicted: number; actual: number; count: number }[] } {
    const brier = predictions.length > 0 ? predictions.reduce((s, p) => s + Math.pow(p.predicted - p.outcome, 2), 0) / predictions.length : 0;
    const buckets = [];
    for (let i = 0; i < 10; i++) {
      const lo = i / 10, hi = (i + 1) / 10;
      const bucket = predictions.filter(p => p.predicted >= lo && p.predicted < hi);
      const actual = bucket.length > 0 ? bucket.reduce((s, p) => s + p.outcome, 0) / bucket.length : 0;
      buckets.push({ range: `${(lo * 100).toFixed(0)}-${(hi * 100).toFixed(0)}%`, predicted: (lo + hi) / 2, actual, count: bucket.length });
    }
    const calibration = buckets.reduce((s, b) => s + Math.abs(b.predicted - b.actual) * b.count, 0) / Math.max(1, predictions.length);
    return { brierScore: brier, calibration, buckets };
  }

  calculateSuperforecasterScore(predictions: { predicted: number; outcome: number; baseline: number }[]): { score: number; relativeSkill: number; rank: "novice" | "intermediate" | "expert" | "superforecaster" } {
    if (predictions.length === 0) return { score: 0, relativeSkill: 0, rank: "novice" };
    const userBrier = predictions.reduce((s, p) => s + Math.pow(p.predicted - p.outcome, 2), 0) / predictions.length;
    const baselineBrier = predictions.reduce((s, p) => s + Math.pow(p.baseline - p.outcome, 2), 0) / predictions.length;
    const relativeSkill = baselineBrier > 0 ? (1 - userBrier / baselineBrier) * 100 : 0;
    const score = Math.max(0, relativeSkill);
    const rank = score > 50 ? "superforecaster" : score > 30 ? "expert" : score > 15 ? "intermediate" : "novice";
    return { score, relativeSkill, rank };
  }

  async getTrendingQuestions(limit = 10): Promise<MetaculusQuestion[]> {
    const questions = await this.getQuestions("open", limit, 0, undefined, "-volume24hr");
    return questions.filter(q => q.volume24h > 0).sort((a, b) => b.volume24h - a.volume24h);
  }

  async getHighConvictionSignals(minForecasters = 100, minConfidence = 0.7): Promise<{ question: MetaculusQuestion; signal: "bullish" | "bearish"; confidence: number; reasoning: string }[]> {
    const questions = await this.getQuestions("open", 100);
    return questions.filter(q => q.numForecasters >= minForecasters && (q.communityPrediction > minConfidence || q.communityPrediction < 1 - minConfidence)).map(q => ({ question: q, signal: q.communityPrediction > 0.5 ? "bullish" : "bearish", confidence: Math.abs(q.communityPrediction - 0.5) * 2, reasoning: `${q.numForecasters} forecasters predict ${(q.communityPrediction * 100).toFixed(1)}%` }));
  }

  private authHeaders(): Record<string, string> { return this.apiKey ? { "Authorization": `Token ${this.apiKey}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }
  private generateMockDistribution(center: number): { bucket: number; count: number }[] { return Array.from({ length: 10 }, (_, i) => ({ bucket: i / 10 + 0.05, count: Math.floor(Math.exp(-Math.pow(i / 10 + 0.05 - center, 2) * 50) * 100) })); }
  private parseQuestion(raw: Record<string, unknown>): MetaculusQuestion { return { id: String(raw.id || ""), title: (raw.title as string) || "", description: (raw.description as string) || "", type: ((raw.question_type as string) || "binary") as MetaculusQuestion["type"], resolutionCriteria: (raw.resolution_criteria as string) || "", closeTime: new Date(raw.close_time as string || Date.now()).getTime(), resolveTime: raw.resolve_time ? new Date(raw.resolve_time as string).getTime() : undefined, status: ((raw.status as string) || "open") as MetaculusQuestion["status"], communityPrediction: (raw.community_prediction as number) || 0.5, numForecasters: (raw.num_forecasters as number) || 0, numPredictions: (raw.num_predictions as number) || 0, volume24h: 0, tags: (raw.tags as string[]) || [], url: (raw.url as string) || "", createdAt: new Date(raw.created_time as string || Date.now()).getTime() }; }
  private parsePrediction(raw: Record<string, unknown>): MetaculusPrediction { return { id: String(raw.id || ""), questionId: String(raw.question_id || ""), userId: String(raw.user_id || ""), prediction: (raw.prediction as number) || 0, confidence: (raw.confidence as number) || 0, createdAt: new Date(raw.created_at as string || Date.now()).getTime(), updatedAt: new Date(raw.updated_at as string || Date.now()).getTime() }; }
  private parseUser(raw: Record<string, unknown>): MetaculusUser { return { id: String(raw.id || ""), username: (raw.username as string) || "", name: (raw.name as string) || "", bio: raw.bio as string | undefined, reputation: (raw.reputation as number) || 0, rank: (raw.rank as number) || 0, numQuestions: (raw.num_questions as number) || 0, numPredictions: (raw.num_predictions as number) || 0, calibration: (raw.calibration as number) || 0, brierScore: (raw.brier_score as number) || 0, isSuperforecaster: (raw.is_superforecaster as boolean) || false }; }
  private parseTournament(raw: Record<string, unknown>): MetaculusTournament { return { id: String(raw.id || ""), name: (raw.name as string) || "", description: (raw.description as string) || "", startDate: new Date(raw.start_date as string || Date.now()).getTime(), endDate: new Date(raw.end_date as string || Date.now()).getTime(), questions: (raw.questions as string[]) || [], leaderboard: [], status: ((raw.status as string) || "active") as MetaculusTournament["status"] }; }
}
