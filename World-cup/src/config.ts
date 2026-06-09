/**
 * World Cup Jelly SDK — Configuration
 *
 * Validates, normalizes, and provides typed access to SDK configuration.
 * Supports environment variable fallbacks and runtime overrides.
 */

import { WorldCupSDKConfig, DEFAULT_CONFIG } from './types.js';
import { ConfigError } from './errors.js';

export class SDKConfig {
  private config: Required<WorldCupSDKConfig>;

  constructor(input: WorldCupSDKConfig = {}) {
    this.config = this.applyDefaults(input);
    this.validate();
  }

  private applyDefaults(input: WorldCupSDKConfig): Required<WorldCupSDKConfig> {
    return {
      providers: {
        jellyApi: {
          apiKey: input.providers?.jellyApi?.apiKey ?? process.env['JELLY_API_KEY'] ?? DEFAULT_CONFIG.providers.jellyApi.apiKey,
          baseUrl: input.providers?.jellyApi?.baseUrl ?? DEFAULT_CONFIG.providers.jellyApi.baseUrl,
        },
        footballApi: {
          apiKey: input.providers?.footballApi?.apiKey ?? process.env['FOOTBALL_API_KEY'] ?? DEFAULT_CONFIG.providers.footballApi.apiKey,
          baseUrl: input.providers?.footballApi?.baseUrl ?? DEFAULT_CONFIG.providers.footballApi.baseUrl,
        },
        sportradar: {
          apiKey: input.providers?.sportradar?.apiKey ?? process.env['SPORTRADAR_API_KEY'] ?? DEFAULT_CONFIG.providers.sportradar.apiKey,
          baseUrl: input.providers?.sportradar?.baseUrl ?? DEFAULT_CONFIG.providers.sportradar.baseUrl,
        },
        news: {
          apiKey: input.providers?.news?.apiKey ?? process.env['NEWS_API_KEY'] ?? DEFAULT_CONFIG.providers.news.apiKey,
          baseUrl: input.providers?.news?.baseUrl ?? DEFAULT_CONFIG.providers.news.baseUrl,
        },
        weather: {
          apiKey: input.providers?.weather?.apiKey ?? process.env['OPENWEATHER_API_KEY'] ?? DEFAULT_CONFIG.providers.weather.apiKey,
          baseUrl: input.providers?.weather?.baseUrl ?? DEFAULT_CONFIG.providers.weather.baseUrl,
        },
        referee: {
          apiKey: input.providers?.referee?.apiKey ?? DEFAULT_CONFIG.providers.referee.apiKey,
          baseUrl: input.providers?.referee?.baseUrl ?? DEFAULT_CONFIG.providers.referee.baseUrl,
        },
        polymarket: {
          enabled: input.providers?.polymarket?.enabled ?? DEFAULT_CONFIG.providers.polymarket.enabled,
          apiKey: input.providers?.polymarket?.apiKey ?? DEFAULT_CONFIG.providers.polymarket.apiKey,
        },
        kalshi: {
          enabled: input.providers?.kalshi?.enabled ?? DEFAULT_CONFIG.providers.kalshi.enabled,
          keyId: input.providers?.kalshi?.keyId ?? DEFAULT_CONFIG.providers.kalshi.keyId,
          privateKey: input.providers?.kalshi?.privateKey ?? DEFAULT_CONFIG.providers.kalshi.privateKey,
        },
        betfair: {
          enabled: input.providers?.betfair?.enabled ?? DEFAULT_CONFIG.providers.betfair.enabled,
          apiKey: input.providers?.betfair?.apiKey ?? DEFAULT_CONFIG.providers.betfair.apiKey,
          appKey: input.providers?.betfair?.appKey ?? DEFAULT_CONFIG.providers.betfair.appKey,
        },
      },
      cache: {
        type: input.cache?.type ?? DEFAULT_CONFIG.cache.type,
        ttlSeconds: input.cache?.ttlSeconds ?? DEFAULT_CONFIG.cache.ttlSeconds,
        redisUrl: input.cache?.redisUrl ?? process.env['REDIS_URL'] ?? DEFAULT_CONFIG.cache.redisUrl,
        maxSize: input.cache?.maxSize ?? DEFAULT_CONFIG.cache.maxSize,
      },
      agent: {
        format: input.agent?.format ?? DEFAULT_CONFIG.agent.format,
        maxEvidenceItems: input.agent?.maxEvidenceItems ?? DEFAULT_CONFIG.agent.maxEvidenceItems,
        includeRawOdds: input.agent?.includeRawOdds ?? DEFAULT_CONFIG.agent.includeRawOdds,
        includeShotData: input.agent?.includeShotData ?? DEFAULT_CONFIG.agent.includeShotData,
        includeMomentum: input.agent?.includeMomentum ?? DEFAULT_CONFIG.agent.includeMomentum,
      },
      backtesting: {
        defaultBankroll: input.backtesting?.defaultBankroll ?? DEFAULT_CONFIG.backtesting.defaultBankroll,
        defaultStakePct: input.backtesting?.defaultStakePct ?? DEFAULT_CONFIG.backtesting.defaultStakePct,
        minEdge: input.backtesting?.minEdge ?? DEFAULT_CONFIG.backtesting.minEdge,
        maxOdds: input.backtesting?.maxOdds ?? DEFAULT_CONFIG.backtesting.maxOdds,
      },
      logging: {
        level: input.logging?.level ?? (process.env['SDK_LOG_LEVEL'] as any) ?? DEFAULT_CONFIG.logging.level,
        destination: input.logging?.destination ?? DEFAULT_CONFIG.logging.destination,
        filePath: input.logging?.filePath ?? DEFAULT_CONFIG.logging.filePath,
      },
    };
  }

  private validate(): void {
    const { cache, agent, backtesting } = this.config;

    if (cache.type === 'redis' && !cache.redisUrl) {
      throw new ConfigError('redisUrl is required when cache.type is "redis"', 'cache.redisUrl');
    }

    if (cache.ttlSeconds < 0) {
      throw new ConfigError('cache.ttlSeconds must be non-negative', 'cache.ttlSeconds');
    }

    if (cache.maxSize < 1) {
      throw new ConfigError('cache.maxSize must be at least 1', 'cache.maxSize');
    }

    if (agent.maxEvidenceItems < 1 || agent.maxEvidenceItems > 100) {
      throw new ConfigError('agent.maxEvidenceItems must be between 1 and 100', 'agent.maxEvidenceItems');
    }

    if (backtesting.defaultBankroll <= 0) {
      throw new ConfigError('backtesting.defaultBankroll must be positive', 'backtesting.defaultBankroll');
    }

    if (backtesting.defaultStakePct <= 0 || backtesting.defaultStakePct > 1) {
      throw new ConfigError('backtesting.defaultStakePct must be between 0 and 1', 'backtesting.defaultStakePct');
    }

    if (backtesting.minEdge < 0 || backtesting.minEdge > 1) {
      throw new ConfigError('backtesting.minEdge must be between 0 and 1', 'backtesting.minEdge');
    }

    if (backtesting.maxOdds < 1) {
      throw new ConfigError('backtesting.maxOdds must be at least 1', 'backtesting.maxOdds');
    }
  }

  get<K extends keyof Required<WorldCupSDKConfig>>(key: K): Required<WorldCupSDKConfig>[K] {
    return this.config[key];
  }

  getAll(): Required<WorldCupSDKConfig> {
    return JSON.parse(JSON.stringify(this.config));
  }

  /** Check if the Jelly API provider is configured. */
  get isJellyApiEnabled(): boolean {
    return this.config.providers.jellyApi.apiKey.length > 0;
  }

  /** Check if any betting market provider is enabled. */
  get hasMarketProvider(): boolean {
    return this.config.providers.polymarket.enabled || this.config.providers.kalshi.enabled || this.config.providers.betfair.enabled;
  }

  /** Get the effective API key for the Jelly API. */
  get jellyApiKey(): string {
    return this.config.providers.jellyApi.apiKey;
  }

  /** Get the effective base URL for the Jelly API. */
  get jellyBaseUrl(): string {
    return this.config.providers.jellyApi.baseUrl;
  }

  /** Create a child config with overrides. */
  merge(overrides: Partial<WorldCupSDKConfig>): SDKConfig {
    return new SDKConfig({
      providers: { ...this.config.providers, ...overrides.providers },
      cache: { ...this.config.cache, ...overrides.cache },
      agent: { ...this.config.agent, ...overrides.agent },
      backtesting: { ...this.config.backtesting, ...overrides.backtesting },
      logging: { ...this.config.logging, ...overrides.logging },
    });
  }
}
