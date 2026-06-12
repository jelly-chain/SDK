/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class OkxNft extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "OkxNft"); }
  async getInfo(): Promise<any> { return {}; }
}
