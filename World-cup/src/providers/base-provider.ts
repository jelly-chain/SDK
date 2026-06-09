/** Base interface all data providers must implement. */
export interface BaseProvider {
  readonly name: string;
  readonly enabled: boolean;
  healthCheck(): Promise<boolean>;
}

export abstract class AbstractProvider implements BaseProvider {
  abstract readonly name: string;
  abstract readonly enabled: boolean;

  async healthCheck(): Promise<boolean> {
    return this.enabled;
  }

  protected logRequest(endpoint: string): void {
    if (process.env['SDK_DEBUG']) {
      console.debug(`[${this.name}] ${endpoint}`);
    }
  }

  protected handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[${this.name}] ${context}: ${message}`);
  }
}
