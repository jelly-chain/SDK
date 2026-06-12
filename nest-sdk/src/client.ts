/**
 * Nest Protocol SDK - Price feeds, quote tokens
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface NestQuote { symbol: string; price: number; timestamp: number }

export class NestSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Nest"); }
  async getQuote(symbol: string): Promise<NestQuote | null> { return null; }
}
