/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class NftTrader extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "NftTrader"); }
  async getInfo(): Promise<any> { return {}; }
}
