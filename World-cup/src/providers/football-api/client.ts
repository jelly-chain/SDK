/**
 * football api Provider Client — Stub
 *
 * Placeholder for football-api data integration.
 * Wire this up when the football-api API key is configured.
 */
import { AbstractProvider } from './base-provider.js';

export class football apiClient extends AbstractProvider {
  readonly name = 'football-api';
  readonly enabled = false;

  constructor(config: any = {}) {
    super();
    this.enabled = !!(config.apiKey || config.enabled);
  }

  async healthCheck(): Promise<boolean> {
    return this.enabled;
  }
}
