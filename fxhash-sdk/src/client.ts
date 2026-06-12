/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Fxhash extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Fxhash"); }
  async getInfo(): Promise<any> { return {}; }
}
