// chain-connector/src/rpc.ts
// RPC client with retry, failover, and rate limiting

import { RpcEndpoint, RpcResponse } from './types.js';

interface RateLimiter {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number;
}

export class RpcClient {
  private endpoints: RpcEndpoint[];
  private currentIndex = 0;
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private requestId = 0;

  constructor(endpoints: RpcEndpoint[]) {
    this.endpoints = endpoints;
    for (const ep of endpoints) {
      this.rateLimiters.set(ep.url, {
        tokens: ep.rateLimitPerSecond,
        lastRefill: Date.now(),
        maxTokens: ep.rateLimitPerSecond,
        refillRate: ep.rateLimitPerSecond,
      });
    }
  }

  /**
   * Send a JSON-RPC request with automatic failover.
   */
  async call<T>(method: string, params: unknown[] = [], timeout = 30000): Promise<T> {
    const errors: Error[] = [];

    for (let attempt = 0; attempt < this.endpoints.length; attempt++) {
      const endpoint = this.getNextEndpoint();
      try {
        await this.waitForRateLimit(endpoint.url);
        const result = await this.sendRequest<T>(endpoint.url, method, params, timeout);
        return result;
      } catch (err) {
        errors.push(err as Error);
        continue;
      }
    }

    throw new AggregateError(errors, `All ${this.endpoints.length} RPC endpoints failed for ${method}`);
  }

  /**
   * Send batch JSON-RPC requests.
   */
  async batch<T>(requests: { method: string; params: unknown[] }[]): Promise<T[]> {
    const endpoint = this.getNextEndpoint();
    await this.waitForRateLimit(endpoint.url);
    const id = ++this.requestId;
    const body = requests.map((r, i) => ({
      jsonrpc: '2.0',
      id: id + i,
      method: r.method,
      params: r.params,
    }));

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json() as Promise<T[]>;
  }

  private getNextEndpoint(): RpcEndpoint {
    // Weighted round-robin
    const sorted = [...this.endpoints].sort((a, b) => b.weight - a.weight);
    const ep = sorted[this.currentIndex % sorted.length];
    this.currentIndex++;
    return ep;
  }

  private async waitForRateLimit(url: string): Promise<void> {
    const limiter = this.rateLimiters.get(url);
    if (!limiter) return;

    const now = Date.now();
    const elapsed = (now - limiter.lastRefill) / 1000;
    limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + elapsed * limiter.refillRate);
    limiter.lastRefill = now;

    if (limiter.tokens < 1) {
      const waitMs = ((1 - limiter.tokens) / limiter.refillRate) * 1000;
      await new Promise(r => setTimeout(r, waitMs));
      limiter.tokens = 0;
    } else {
      limiter.tokens -= 1;
    }
  }

  private async sendRequest<T>(url: string, method: string, params: unknown[], timeout: number): Promise<T> {
    const id = ++this.requestId;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: RpcResponse<T> = await response.json();

      if (data.error) throw new Error(`RPC error ${data.error.code}: ${data.error.message}`);
      if (data.result === undefined) throw new Error('Empty RPC response');

      return data.result;
    } finally {
      clearTimeout(timer);
    }
  }
}
