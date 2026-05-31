export class PolymarketError extends Error {
  public readonly code: string;
  constructor(message: string, code: string = 'POLYMARKET_ERROR') {
    super(message);
    this.code = code;
  }
}
export class PolymarketAuthError extends PolymarketError {
  constructor() { super('Invalid Polymarket credentials', 'AUTH_ERROR'); }
}
export class PolymarketRateLimitError extends PolymarketError {
  constructor() { super('Rate limit exceeded', 'RATE_LIMIT'); }
}
