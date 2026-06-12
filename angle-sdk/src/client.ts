/**
 * angle SDK - Price feeds and data
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";

export interface angleFeed { address: string; asset: string; price: number; decimals: number; updatedAt: number }
export interface angleConfig extends BaseSDKConfig { chainId: ChainId }

export class angleSDK extends BaseSDK {
  readonly chainId: ChainId;
  constructor(config: angleConfig) { super(config, `angle:${chainId}`); this.chainId = chainId; }
  async getPrice(asset: string): Promise<number> { return 0; }
  async getPriceFeed(address: string): Promise<angleFeed | null> { return null; }
  async getAllFeeds(): Promise<angleFeed[]> { return []; }
}
