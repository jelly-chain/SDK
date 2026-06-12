/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class UniswapMulticall extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "UniswapMulticall"); }
  async getInfo(): Promise<any> { return {}; }
}
