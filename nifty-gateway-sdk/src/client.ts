/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class NiftyGateway extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "NiftyGateway"); }
  async getInfo(): Promise<any> { return {}; }
}
