import { BaseProvider } from './base-provider.js';

export interface ProviderHealth {
  name: string;
  enabled: boolean;
  healthy: boolean;
  checkedAt: string;
}

export interface FailoverAttempt<T> {
  providerName: string;
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Provider manager with simple failover: try providers in order until one succeeds.
 */
export class ProviderManager {
  private readonly providers: Map<string, BaseProvider> = new Map();

  register(provider: BaseProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): BaseProvider | undefined {
    return this.providers.get(name);
  }

  list(): BaseProvider[] {
    return [...this.providers.values()];
  }

  enabled(): BaseProvider[] {
    return this.list().filter((p) => p.enabled);
  }

  async healthCheck(): Promise<ProviderHealth[]> {
    return Promise.all(
      this.list().map(async (p) => ({
        name: p.name,
        enabled: p.enabled,
        healthy: await p.healthCheck().catch(() => false),
        checkedAt: new Date().toISOString(),
      })),
    );
  }

  /**
   * Execute an async operation against multiple providers in order.
   *
   * - Only enabled providers are eligible.
   * - Providers are attempted sequentially.
   * - Throws aggregated error if all fail.
   */
  async withFailover<T>(params: {
    /** Ordered provider names, highest priority first. */
    providerNames: string[];
    operation: (provider: BaseProvider) => Promise<T>;
  }): Promise<{ data: T; attempts: FailoverAttempt<T>[]; usedProvider: string }> {
    const { providerNames, operation } = params;

    const attempts: FailoverAttempt<T>[] = [];
    const namesToTry = providerNames
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    for (const name of namesToTry) {
      const provider = this.get(name);
      if (!provider) {
        attempts.push({ providerName: name, success: false, error: 'Provider not registered' });
        continue;
      }

      if (!provider.enabled) {
        attempts.push({ providerName: name, success: false, error: 'Provider disabled' });
        continue;
      }

      try {
        const data = await operation(provider);
        attempts.push({ providerName: name, success: true, data });
        return { data, attempts, usedProvider: name };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attempts.push({ providerName: name, success: false, error: message });
      }
    }

    const lastErrors = attempts
      .filter((a) => !a.success && a.error)
      .map((a) => `${a.providerName}: ${a.error}`)
      .join(' | ');

    throw new Error(`Failover: all providers failed. ${lastErrors}`);
  }
}
