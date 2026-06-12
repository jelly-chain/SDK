/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class ElementV2 extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "ElementV2"); }
  async getInfo(): Promise<any> { return {}; }
}
