/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class UniswapUniversalRouter extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "UniswapUniversalRouter"); }
  async getInfo(): Promise<any> { return {}; }
}
