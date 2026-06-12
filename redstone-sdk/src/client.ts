/**
 * redstone SDK - Price feeds and data
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";

export interface redstoneFeed { address: string; asset: string; price: number; decimals: number; updatedAt: number }
export interface redstoneConfig extends BaseSDKConfig { chainId: ChainId }

export class redstoneSDK extends BaseSDK {
  readonly chainId: ChainId;
  constructor(config: redstoneConfig) { super(config, `redstone:${chainId}`); this.chainId = chainId; }
  async getPrice(asset: string): Promise<number> { return 0; }
  async getPriceFeed(address: string): Promise<redstoneFeed | null> { return null; }
  async getAllFeeds(): Promise<redstoneFeed[]> { return []; }
}
