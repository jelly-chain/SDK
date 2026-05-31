export interface KalshiConfig {
  enabled?: boolean;
  keyId?: string;
  privateKey?: string;
  baseUrl?: string;
}

export interface KalshiMarket {
  ticker: string;
  title: string;
  category: string;
  closeTime: string;
  status: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
}

/**
 * Read-only client stub for the Kalshi prediction market API.
 * Requires KALSHI_KEY_ID and KALSHI_PRIVATE_KEY for authenticated endpoints.
 */
export class KalshiClient {
  private enabled: boolean;
  private keyId: string;
  private baseUrl: string;

  constructor(config: KalshiConfig = {}) {
    this.enabled = config.enabled ?? false;
    this.keyId = config.keyId ?? process.env['KALSHI_KEY_ID'] ?? '';
    this.baseUrl = config.baseUrl ?? 'https://trading-api.kalshi.com/trade-api/v2';
  }

  /** Search for Kalshi markets by keyword. */
  async search(query: string): Promise<KalshiMarket[]> {
    if (!this.enabled) return [];
    return [];
  }

  /** Fetch a specific market by its ticker symbol. */
  async market(ticker: string): Promise<KalshiMarket | null> {
    if (!this.enabled) return null;
    return null;
  }
}
