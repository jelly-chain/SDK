import { BaseProvider } from './base-provider.js';

/** Manages the lifecycle and health of all registered data providers. */
export class ProviderManager {
  private providers = new Map<string, BaseProvider>();

  register(provider: BaseProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): BaseProvider | undefined {
    return this.providers.get(name);
  }

  listEnabled(): BaseProvider[] {
    return Array.from(this.providers.values()).filter(p => p.enabled);
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, provider] of this.providers) {
      results[name] = await provider.healthCheck().catch(() => false);
    }
    return results;
  }
}
