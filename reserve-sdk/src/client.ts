/**
 * Reserve SDK - RSV stablecoin, overcollateralization
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface ReservePosition { collateral: string; amount: bigint; debt: bigint; collateralRatio: number }

export class ReserveSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Reserve"); }
  async getPosition(address: string): Promise<ReservePosition | null> { return null; }
  async mintRsv(amount: bigint): Promise<{ rsvAmount: bigint }> { return { rsvAmount: amount }; }
}
