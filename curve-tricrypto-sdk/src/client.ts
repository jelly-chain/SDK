/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class CurveTricrypto extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "CurveTricrypto"); }
  async getInfo(): Promise<any> { return {}; }
}
