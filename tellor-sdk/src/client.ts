/**
 * Tellor SDK - Decentralized oracle, TRB staking
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface TellorPrice { timestamp: number; value: bigint; reporter: string }

export class TellorSDK extends BaseSDK {
  constructor(config: BaseSDKConfig) { super(config, "Tellor"); }
  async getPrice(queryId: string): Promise<TellorPrice | null> { return null; }
  async getCurrentValue(queryId: string): Promise<bigint> { return 0n; }
}
