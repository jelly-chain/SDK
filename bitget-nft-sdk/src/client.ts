/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class BitgetNft extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "BitgetNft"); }
  async getInfo(): Promise<any> { return {}; }
}
