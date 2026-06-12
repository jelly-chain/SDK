/**
 * Tensor SDK - Solana NFT marketplace
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export class TensorSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Tensor"); }
}
