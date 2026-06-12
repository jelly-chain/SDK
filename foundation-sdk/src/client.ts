/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Foundation extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Foundation"); }
  async getInfo(): Promise<any> { return {}; }
}
