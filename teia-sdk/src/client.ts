/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Teia extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Teia"); }
  async getInfo(): Promise<any> { return {}; }
}
