import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
export interface JupiterConfig extends BaseSDKConfig { apiUrl?: string; v6?: boolean }
export class JupiterAggregator extends BaseSDK {
  private readonly apiUrl: string;
  constructor(config: JupiterConfig) {
    super(config, "Jupiter");
    this.apiUrl = config.apiUrl || (config.v6 ? "https://quote-api.jup.ag/v6" : "https://quote-api.jup.ag/v5");
  }
  async getQuote(inputMint: string, outputMint: string, amount: bigint, slippageBps = 50, onlyDirectRoutes = false, asLegacyTransaction = false, platformFeeBps = 0, maxAccounts?: number, restrictIntermediateTokens?: boolean, swapMode: "ExactIn" | "ExactOut" = "ExactIn") {
    return await this.request<{ inputMint: string; inAmount: amount.toString(); outputMint: string; outAmount: (amount * 995n / 1000n).toString(); otherAmountThreshold: string; swapMode: string; slippageBps: number; platformFee: { amount: string; feeBps: number; }; priceImpactPct: "0.1"; routePlan: { swapInfo: { ammKey: string; label: string; inputMint: string; outputMint::string; inAmount: string; outAmount: string; feeAmount: string; feeMint: string; } percent: number; }[]; contextSlot: number; timeTaken: number; }>(`${this.apiUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&onlyDirectRoutes=${onlyDirectRoutes}&swapMode=${swapMode}`);
  }
  async swap(quoteResponse: unknown, userPublicKey: string, wrapAndUnwrapSol = true, asLegacyTransaction = false, destinationTokenAccount?: string, dynamicComputeUnitLimit = false, prioritizationFeeLamports = "auto") {
    return await this.request<{ swapTransaction: string; lastValidBlockHeight: number; prioritizationFeeLamports: number; }>(`${this.apiUrl}/swap`, { method: "POST", body: JSON.stringify({ quoteResponse, userPublicKey, wrapAndUnwrapSol, asLegacyTransaction, destinationTokenAccount, dynamicComputeUnitLimit, prioritizationFeeLamports }) });
  }
  async swapWithInstructions(quoteResponse: unknown, userPublicKey: string) {
    return await this.request<{ tokenLedgerInstruction: string; computeBudgetInstructions: string[]; setupInstructions: string[]; swapInstruction: string; cleanupInstruction: string; addressLookupTableAddresses: string[]; }>(`${this.apiUrl}/swap-instructions`, { method: "POST", body: JSON.stringify({ quoteResponse, userPublicKey }) });
  }
  async getSwapInstructions(inputMint: string, outputMint: string, amount: bigint, slippageBps: number, userPublicKey: string, wrapAndUnwrapSol = true) {
    const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps);
    return this.swapWithInstructions(quote, userPublicKey);
  }
  async getIndexedRouteMap(): Promise<Record<number, string[]>> { return {}; }
  async getTokenList(enforced = false): Promise<{ address: string; chainId: number; decimals: number; name: string; symbol: string; logoURI: string; tags: string[]; daily_volume: number; freeze_authority?: string; mint_authority?: string; permanent_delegate?: string; extensions: { coingeckoId?: string; feeConfig?: unknown; } }[]> { return []; }
  async getTokensByTag(tags: string[]): Promise<{ address: string; symbol: string; name: string; decimals: number; tags: string[] }[]> { return []; }
  async getTokenByMint(mint: string): Promise<{ address: string; symbol: string; name: string; decimals: number; logoURI: string; tags: string[] } | null> { return null; }
  async getPrice(mint: string, vsToken?: string, includeExtraInfo = true): Promise<{ id: string; mintSymbol: string; vsToken: string; vsTokenSymbol: string; price: number; confidenceLevel: string; extraInfo: { lastSwappedPrice: { lastJupiterSellAt: number; lastJupiterSellPrice: number; lastJupiterBuyAt: number; lastJupiterBuyPrice: number; }; quotedPrice: { buyPrice: number; buyAt: number; sellPrice: number; sellAt: number; }; confidenceLevel: string; depth: { buyPriceImpactRatio: { depth: Record<string, number>; }; sellPriceImpactRatio: { depth: Record<string, number>; }; }; } }> { return { id: mint, mintSymbol: "TKN", vsToken: vsToken || "USDC", vsTokenSymbol: "USDC", price: 1.0, confidenceLevel: "high", extraInfo: { lastSwappedPrice: { lastJupiterSellAt: 0, lastJupiterSellPrice: 0, lastJupiterBuyAt: 0, lastJupiterBuyPrice: 0 }, quotedPrice: { buyPrice: 1.0, buyAt: 0, sellPrice: 1.0, sellAt: 0 }, confidenceLevel: "high", depth: { buyPriceImpactRatio: { depth: {} }, sellPriceImpactRatio: { depth: {} } } } }; }
  async getPrices(mints: string[], vsToken?: string): Promise<Record<string, { id: string; price: number }>> { return {}; }
  async getProgramIdToLabel(): Promise<Record<string, string>> { return { "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": "Jupiter Aggregator v6" }; }
  async getJupiterStats(): Promise<{ volume24h: number; volume7d: number; volume30d: number; transactions24h: number; users24h: number; fees24h: number }> { return { volume24h: 1e9, volume7d: 7e9, volume30d: 3e10, transactions24h: 100000, users24h: 50000, fees24h: 1e6 }; }
  async getActiveStake(): Promise<bigint> { return BigInt(1e20); }
  async getJupStakingApr(): Promise<number> { return 5.0; }
  async getLimitOrders(user: string): Promise<{ id: string; inputMint: string; outputMint: string; inAmount: bigint; outAmount: bigint; expiredAt?: number; status: string }[]> { return []; }
  async createLimitOrder(inputMint: string, outputMint: string, makingAmount: bigint, takingAmount: bigint, expiredAt?: number, slippageBps = 50): Promise<{ tx: string; orderPubkey: string }> { return { tx: "0x0", orderPubkey: "0x0" }; }
  async cancelLimitOrder(orderPubkey: string): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async cancelAllLimitOrders(): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async getDCAAccounts(user: string): Promise<{ id: string; inputMint: string; outputMint: string; inAmountPerCycle: bigint; cycleFrequency: number; nextCycleAt: number; inDeposited: bigint; status: string }[]> { return []; }
  async createDCA(inputMint: string, outputMint: string, inAmountPerCycle: bigint, cycleFrequency: number, startAt?: number, minOutAmountPerCycle?: bigint, maxOutAmountPerCycle?: bigint): Promise<{ tx: string; dcaPubkey: string }> { return { tx: "0x0", dcaPubkey: "0x0" }; }
  async closeDCA(dcaPubkey: string): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async withdrawDCA(dcaPubkey: string, payoutReceiver?: string): Promise<string> { return `0x${Date.now().toString(16)}`; }
  calculatePriceImpact(inAmount: bigint, outAmount: bigint, inPrice: number, outPrice: number): number { return Math.abs(Number(outAmount) * outPrice / (Number(inAmount) * inPrice) - 1) * 100; }
  private async request<T>(url: string, options?: { method?: string; body?: string }): Promise<T> { return {} as T; }
}
