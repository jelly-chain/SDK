/**
 * sportradar Provider Client — Stub
 *
 * Placeholder for sportradar data integration.
 * Wire this up when the sportradar API key is configured.
 */
import { AbstractProvider } from './base-provider.js';

export class sportradarClient extends AbstractProvider {
  readonly name = 'sportradar';
  readonly enabled = false;

  constructor(config: any = {}) {
    super();
    this.enabled = !!(config.apiKey || config.enabled);
  }

  async healthCheck(): Promise<boolean> {
    return this.enabled;
  }
}
