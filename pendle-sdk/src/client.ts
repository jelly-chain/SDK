/**
 * Pendle SDK - Yield tokenization, PTs, YTs
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface PendleMarket { marketAddress: string; pt: string; yt: string; expiry: number; underlying: string }

export class PendleSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Pendle"); }
  async getMarket(marketAddress: string): Promise<PendleMarket | null> { return null; }
  async getPT(marketAddress: string): Promise<string> { return "0x"; }
  async getYT(marketAddress: string): Promise<string> { return "0x"; }
}
