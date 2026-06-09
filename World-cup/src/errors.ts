/**
 * World Cup Jelly SDK — Error Hierarchy
 *
 * Structured error types for every failure mode in the SDK:
 * provider errors, validation errors, not-found, rate limits,
 * config errors, market errors, and backtesting errors.
 */

export class WorldCupSDKError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly context: Record<string, unknown>;

  constructor(message: string, code: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'WorldCupSDKError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

export class ProviderError extends WorldCupSDKError {
  public readonly provider: string;
  public readonly statusCode: number | null;
  public readonly endpoint: string | null;

  constructor(
    message: string,
    provider: string,
    statusCode: number | null = null,
    endpoint: string | null = null,
  ) {
    super(message, 'PROVIDER_ERROR', { provider, statusCode, endpoint });
    this.name = 'ProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }

  get isRetryable(): boolean {
    if (this.statusCode === null) return true;
    return this.statusCode >= 500 || this.statusCode === 429;
  }

  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  get isRateLimit(): boolean {
    return this.statusCode === 429;
  }
}

export class NotFoundError extends WorldCupSDKError {
  public readonly entity: string;
  public readonly entityId: string;

  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND', { entity, entityId: id });
    this.name = 'NotFoundError';
    this.entity = entity;
    this.entityId = id;
  }
}

export class ValidationError extends WorldCupSDKError {
  public readonly field: string | null;
  public readonly value: unknown;

  constructor(message: string, field: string | null = null, value: unknown = null) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class ConfigError extends WorldCupSDKError {
  constructor(message: string, field: string | null = null) {
    super(message, 'CONFIG_ERROR', { field });
    this.name = 'ConfigError';
  }
}

export class MarketError extends WorldCupSDKError {
  public readonly platform: string;
  public readonly marketId: string | null;

  constructor(message: string, platform: string, marketId: string | null = null) {
    super(message, 'MARKET_ERROR', { platform, marketId });
    this.name = 'MarketError';
    this.platform = platform;
    this.marketId = marketId;
  }
}

export class RateLimitError extends WorldCupSDKError {
  public readonly retryAfter: number | null;
  public readonly provider: string;

  constructor(provider: string, retryAfter: number | null = null) {
    super(
      `Rate limited by ${provider}${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      'RATE_LIMIT',
      { provider, retryAfter },
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.provider = provider;
  }
}

export class BacktestError extends WorldCupSDKError {
  public readonly strategy: string | null;

  constructor(message: string, strategy: string | null = null) {
    super(message, 'BACKTEST_ERROR', { strategy });
    this.name = 'BacktestError';
    this.strategy = strategy;
  }
}

export class CacheError extends WorldCupSDKError {
  public readonly operation: string;
  public readonly key: string | null;

  constructor(message: string, operation: string, key: string | null = null) {
    super(message, 'CACHE_ERROR', { operation, key });
    this.name = 'CacheError';
    this.operation = operation;
    this.key = key;
  }
}

export class AgentError extends WorldCupSDKError {
  public readonly tool: string | null;

  constructor(message: string, tool: string | null = null) {
    super(message, 'AGENT_ERROR', { tool });
    this.name = 'AgentError';
    this.tool = tool;
  }
}

export class PredictionError extends WorldCupSDKError {
  public readonly predictionType: string | null;

  constructor(message: string, predictionType: string | null = null) {
    super(message, 'PREDICTION_ERROR', { predictionType });
    this.name = 'PredictionError';
    this.predictionType = predictionType;
  }
}

/**
 * Type guard: checks if an error is a WorldCupSDKError.
 */
export function isSDKError(error: unknown): error is WorldCupSDKError {
  return error instanceof WorldCupSDKError;
}

/**
 * Wraps any error into the appropriate SDK error type.
 */
export function wrapError(error: unknown, context: Record<string, unknown> = {}): WorldCupSDKError {
  if (error instanceof WorldCupSDKError) return error;
  if (error instanceof Error) {
    return new WorldCupSDKError(error.message, 'UNKNOWN_ERROR', context);
  }
  return new WorldCupSDKError(String(error), 'UNKNOWN_ERROR', context);
}
