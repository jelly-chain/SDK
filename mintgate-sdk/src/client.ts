/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Mintgate extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Mintgate"); }
  async getInfo(): Promise<any> { return {}; }
}
