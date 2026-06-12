/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Rarible extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Rarible"); }
  async getInfo(): Promise<any> { return {}; }
}
