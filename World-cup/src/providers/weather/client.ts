/**
 * weather Provider Client — Stub
 *
 * Placeholder for weather data integration.
 * Wire this up when the weather API key is configured.
 */
import { AbstractProvider } from './base-provider.js';

export class weatherClient extends AbstractProvider {
  readonly name = 'weather';
  readonly enabled = false;

  constructor(config: any = {}) {
    super();
    this.enabled = !!(config.apiKey || config.enabled);
  }

  async healthCheck(): Promise<boolean> {
    return this.enabled;
  }
}
