/**
 * SDK Core - Base SDK class for all JellyOS SDKs
 */
export abstract class BaseSDK {
  protected config: BaseSDKConfig;
  protected name: string;
  constructor(config: BaseSDKConfig, name: string) {
    this.config = config;
    this.name = name;
  }
  protected rpcCall<T>(method: string, params: unknown[]): Promise<T> {
    return {} as T;
  }
}
export interface BaseSDKConfig {
  rpcUrl?: string;
  apiKey?: string;
}
