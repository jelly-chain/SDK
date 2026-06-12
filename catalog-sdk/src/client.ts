/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Catalog extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Catalog"); }
  async getInfo(): Promise<any> { return {}; }
}
