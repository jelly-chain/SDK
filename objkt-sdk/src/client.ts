/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Objkt extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Objkt"); }
  async getInfo(): Promise<any> { return {}; }
}
