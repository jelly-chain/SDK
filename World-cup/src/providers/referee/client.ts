/**
 * referee Provider Client — Stub
 *
 * Placeholder for referee data integration.
 * Wire this up when the referee API key is configured.
 */
import { AbstractProvider } from './base-provider.js';

export class refereeClient extends AbstractProvider {
  readonly name = 'referee';
  readonly enabled = false;

  constructor(config: any = {}) {
    super();
    this.enabled = !!(config.apiKey || config.enabled);
  }

  async healthCheck(): Promise<boolean> {
    return this.enabled;
  }
}
