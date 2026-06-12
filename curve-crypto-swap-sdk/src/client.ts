/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class CurveCryptoSwap extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "CurveCryptoSwap"); }
  async getInfo(): Promise<any> { return {}; }
}
