/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class MexcNft extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "MexcNft"); }
  async getInfo(): Promise<any> { return {}; }
}
