/**
 * Sportradar SDK Error Classes
 */

export class SportradarError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: string;

  constructor(message: string, code: string = 'SPORTRADAR_ERROR', statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

export class SportradarAuthError extends SportradarError {
  constructor(message: string = 'Invalid or missing API key') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class SportradarRateLimitError extends SportradarError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`, 'RATE_LIMIT', 429);
    this.retryAfter = retryAfter;
  }
}

export class SportradarNotFoundError extends SportradarError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
  }
}

export class SportradarTimeoutError extends SportradarError {
  constructor(endpoint: string, timeoutMs: number) {
    super(`Request to ${endpoint} timed out after ${timeoutMs}ms`, 'TIMEOUT', 408);
  }
}

export function isSportradarError(error: unknown): error is SportradarError {
  return error instanceof SportradarError;
}
