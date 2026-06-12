/**
 * Beefy SDK - Yield aggregator, strategies, vaults
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface BeefyVault { id: string; name: string; token: string; tvl: number; apr: number; apy: number }

export class BeefySDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Beefy"); }
  async getVault(vaultId: string): Promise<BeefyVault | null> { return null; }
  async getAllVaults(): Promise<BeefyVault[]> { return []; }
}
