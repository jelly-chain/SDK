/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Superrare extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Superrare"); }
  async getInfo(): Promise<any> { return {}; }
}
