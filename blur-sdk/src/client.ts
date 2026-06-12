/**
 * Blur SDK - NFT trading, orders, collections
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface BlurOrder { orderId: string; maker: string; nft: string; minPrice: bigint }

export class BlurSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Blur"); }
  async getOrder(orderId: string): Promise<BlurOrder | null> { return null; }
}
