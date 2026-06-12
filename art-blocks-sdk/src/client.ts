/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class ArtBlocks extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "ArtBlocks"); }
  async getInfo(): Promise<any> { return {}; }
}
