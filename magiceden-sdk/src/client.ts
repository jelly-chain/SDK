/**
 * Magic Eden SDK - NFT marketplace, orders
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export class MagicEdenSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "MagicEden"); }
  async getCollection(symbol: string): Promise<any> { return {}; }
}
