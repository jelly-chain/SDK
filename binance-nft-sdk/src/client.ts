/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class BinanceNft extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "BinanceNft"); }
  async getInfo(): Promise<any> { return {}; }
}
