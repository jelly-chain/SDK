/**
 * news Provider Client — Stub
 *
 * Placeholder for news data integration.
 * Wire this up when the news API key is configured.
 */
import { AbstractProvider } from './base-provider.js';

export class newsClient extends AbstractProvider {
  readonly name = 'news';
  readonly enabled = false;

  constructor(config: any = {}) {
    super();
    this.enabled = !!(config.apiKey || config.enabled);
  }

  async healthCheck(): Promise<boolean> {
    return this.enabled;
  }
}
