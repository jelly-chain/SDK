/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class BybitNft extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "BybitNft"); }
  async getInfo(): Promise<any> { return {}; }
}
