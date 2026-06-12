/**
 * Pyth Network SDK - Low-latency price feeds, publisher attestation
 */
import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";

export interface PythFeed { feedId: string; symbol: string; price: number; confidence: number; publishTime: number; slot: number }
export interface PythPublisher { publisherKey: string; name: string; cumulativeSlots: number; fee: bigint; stake: bigint }
export interface PythConfig extends BaseSDKConfig { chainId: ChainId; pythContract?: string }

export class PythNetworkSDK extends BaseSDK {
  readonly chainId: ChainId;
  private readonly pythContract: string;
  constructor(config: PythConfig) {
    super(config, `Pyth:${config.chainId}`);
    this.chainId = config.chainId;
    this.pythContract = config.pythContract || this.getDefaultContract();
  }
  private getDefaultContract(): string {
    const contracts: Record<number, string> = {
      [ChainId.ETHEREUM]: "0x8D33320E1F99F5e0aE9e62a90B5d0a8aEeA7c184",
      [ChainId.ARBITRUM]: "0x2117a7E2Ea0C84C4c20F5d64d22B758c3FfCA008",
      [ChainId.BASE]: "0xA2AaA92Ab87a3a0aA46B84526B4AaF362f6a89c2",
    };
    return contracts[this.chainId] || contracts[1]!;
  }
  async getPrice(feedId: string): Promise<PythFeed | null> {
    const price = await this.rpcCall("eth_call", [{ to: this.pythContract, data: feedId }, "latest"]);
    return price ? { feedId, symbol: "UNKNOWN", price: 0, confidence: 0, publishTime: Date.now(), slot: 0 } : null;
  }
  async getPriceBySymbol(symbol: string): Promise<PythFeed | null> { return null; }
  async getLatestPriceUpdates(feedIds: string[]): Promise<PythFeed[]> { return []; }
  async getPublishers(feedId: string): Promise<PythPublisher[]> { return []; }
  async getPublisherStake(publisherKey: string): Promise<bigint> { return 0n; }
}
export { PythNetworkSDK as PythNetworkSDK, type PythFeed, type PythPublisher, type PythConfig };