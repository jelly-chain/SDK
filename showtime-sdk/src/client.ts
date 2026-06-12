/**
 * SDK - Client implementation
 */
import { BaseSDK } from "@jellychain/sdk-core";

export interface SDKConfig extends BaseSDKConfig {}

export class Showtime extends BaseSDK {
  constructor(config: SDKConfig) { super(config, "Showtime"); }
  async getInfo(): Promise<any> { return {}; }
}
