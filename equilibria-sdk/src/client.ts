/**
 * Equilibrium SDK - pUSD, money market, borrows
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface EquilibriumMarket { asset: string; supplyApy: number; borrowApy: number; tvl: number }

export class EquilibriumSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Equilibrium"); }
  async getMoneyMarket(asset: string): Promise<EquilibriumMarket | null> { return null; }
}
