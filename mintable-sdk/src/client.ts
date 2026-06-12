/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Mintable extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Mintable"); }
  async getInfo(): Promise<any> { return {}; }
}
