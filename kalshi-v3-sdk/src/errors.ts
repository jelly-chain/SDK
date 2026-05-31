export class KalshiError extends Error { public readonly code: string; constructor(m: string, c = 'KALSHI_ERROR') { super(m); this.code = c; } }
export class KalshiAuthError extends KalshiError { constructor() { super('Invalid Kalshi credentials', 'AUTH_ERROR'); } }
export class KalshiRateLimitError extends KalshiError { constructor() { super('Rate limit exceeded', 'RATE_LIMIT'); } }
