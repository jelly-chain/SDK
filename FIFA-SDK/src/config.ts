import { WorldCupSDKConfig } from './types.js';
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
        fifa: { enabled: true },
        footballApi: { apiKey: '', baseUrl: 'https://v3.football.api-sports.io' },
        polymarket: { enabled: true },
        kalshi: { enabled: false, keyId: '', privateKey: '' },
        news: { enabled: false, apiKey: '' },
        weather: { enabled: false, apiKey: '' },
        ...input.providers,
      },
      cache: {
        type: 'memory',
        ttlSeconds: 120,
        redisUrl: '',
        ...input.cache,
      },
      agent: {
        format: 'claude-json',
        maxEvidenceItems: 10,
        ...input.agent,
      },
    };
  }

  private validate(): void {
    const { cache } = this.config;
    if (cache.type === 'redis' && !cache.redisUrl) {
      throw new ConfigError('redisUrl is required when cache.type is "redis"');
    }
  }

  get<K extends keyof Required<WorldCupSDKConfig>>(key: K): Required<WorldCupSDKConfig>[K] {
    return this.config[key];
  }

  getAll(): Required<WorldCupSDKConfig> {
    return { ...this.config };
  }
}
