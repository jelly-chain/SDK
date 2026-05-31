import type { MetaculusConfig, MetaculusQuestion, MetaculusCommunityPrediction } from './types.js';

export class MetaculusClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  readonly enabled: boolean;

  constructor(config: MetaculusConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'https://www.metaculus.com/api';
    this.apiToken = config.apiToken ?? process.env['METACULUS_API_TOKEN'] ?? '';
    this.enabled = config.enabled !== false;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiToken) h['Authorization'] = `Token ${this.apiToken}`;
    return h;
  }

  async getQuestions(params: { category?: string; status?: string; limit?: number; offset?: number } = {}): Promise<MetaculusQuestion[]> {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.status) qs.set('status', params.status);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));

    const res = await fetch(`${this.baseUrl}/questions/?${qs}`, { headers: this.headers() });
    if (!res.ok) return [];
    const data = await res.json() as { results: MetaculusQuestion[] };
    return data.results ?? [];
  }

  async getQuestion(questionId: number): Promise<MetaculusQuestion | null> {
    const res = await fetch(`${this.baseUrl}/questions/${questionId}/`, { headers: this.headers() });
    if (!res.ok) return null;
    return res.json() as Promise<MetaculusQuestion>;
  }

  async getCommunityPrediction(questionId: number): Promise<MetaculusCommunityPrediction | null> {
    const res = await fetch(`${this.baseUrl}/questions/${questionId}/predictions/`, { headers: this.headers() });
    if (!res.ok) return null;
    return res.json() as Promise<MetaculusCommunityPrediction>;
  }

  async postPrediction(questionId: number, prediction: number): Promise<boolean> {
    if (!this.apiToken) return false;
    const res = await fetch(`${this.baseUrl}/questions/${questionId}/predict/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ prediction }),
    });
    return res.ok;
  }

  async search(query: string): Promise<MetaculusQuestion[]> {
    const res = await fetch(`${this.baseUrl}/questions/?search=${encodeURIComponent(query)}`, { headers: this.headers() });
    if (!res.ok) return [];
    const data = await res.json() as { results: MetaculusQuestion[] };
    return data.results ?? [];
  }

  async getTrendingQuestions(): Promise<MetaculusQuestion[]> {
    return this.getQuestions({ status: 'open', limit: 20 });
  }

  async getResolvedQuestions(limit: number = 20): Promise<MetaculusQuestion[]> {
    return this.getQuestions({ status: 'resolved', limit });
  }
}
