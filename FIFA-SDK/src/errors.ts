export class WorldCupSDKError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'WorldCupSDKError';
  }
}

export class ProviderError extends WorldCupSDKError {
  constructor(message: string, public readonly provider: string) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
  }
}

export class NotFoundError extends WorldCupSDKError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends WorldCupSDKError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConfigError extends WorldCupSDKError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class MarketError extends WorldCupSDKError {
  constructor(message: string, public readonly platform: string) {
    super(message, 'MARKET_ERROR');
    this.name = 'MarketError';
  }
}
