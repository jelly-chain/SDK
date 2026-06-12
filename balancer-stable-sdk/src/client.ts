/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class BalancerStable extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "BalancerStable"); }
  async getInfo(): Promise<any> { return {}; }
}
