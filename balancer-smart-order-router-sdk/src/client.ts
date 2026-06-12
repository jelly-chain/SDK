/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class BalancerSmartOrderRouter extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "BalancerSmartOrderRouter"); }
  async getInfo(): Promise<any> { return {}; }
}
