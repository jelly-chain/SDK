/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Sound.xyz extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Sound.xyz"); }
  async getInfo(): Promise<any> { return {}; }
}
