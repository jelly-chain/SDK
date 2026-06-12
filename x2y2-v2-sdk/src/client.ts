/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class X2y2V2 extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "X2y2V2"); }
  async getInfo(): Promise<any> { return {}; }
}
