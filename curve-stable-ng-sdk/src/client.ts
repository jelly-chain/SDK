/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class CurveStableNg extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "CurveStableNg"); }
  async getInfo(): Promise<any> { return {}; }
}
