import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";
export interface OdosConfig extends BaseSDKConfig { chainId: ChainId; apiUrl?: string; routerAddress?: string }
export class OdosProtocolSDK extends BaseSDK {
  readonly chainId: ChainId;
  private readonly apiUrl: string;
  private readonly router: string;
  constructor(config: OdosConfig) {
    super(config, `Odos:${config.chainId}`);
    this.chainId = config.chainId;
    this.apiUrl = config.apiUrl || "https://api.odos.xyz";
    this.router = config.routerAddress || "0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559";
  }
  async getQuote(tokenIn: string, tokenOut: string, amount: bigint, slippage = 0.5, userAddr?: string, pathViz = false, sourceBlacklist?: string[], sourceWhitelist?: string[], poolBlacklist?: string[], sim = true): Promise<{ outAmounts: bigint[]; pathId: string; gasEstimate: number; blockNumber: number }> {
    const data = await this.request<{ outAmounts: string[]; pathId: string; gasEstimate: number; blockNumber: number }>(`${this.apiPath()}/sor/quote/v2`, { method: "POST", body: JSON.stringify({ chainId: this.chainId, inputTokens: [{ tokenAddress: tokenIn, amount: amount.toString() }], outputTokens: [{ tokenAddress: tokenOut, proportion: 1 }], userAddr: userAddr || "0x0", slippageLimitPercent: slippage, pathViz, sourceBlacklist, sourceWhitelist, poolBlacklist, sim }) });
    return { outAmounts: data.outAmounts.map(a => BigInt(a)), pathId: data.pathId, gasEstimate: data.gasEstimate, blockNumber: data.blockNumber };
  }
  async assemble(pathId: string, userAddr: string, simulate = true, receiver?: string): Promise<{ transaction: { to: string; data: string; value: string; gas: number }; simulation: { isSuccess: boolean; amountsOut: string[]; gasEstimate: number } }> {
    return { transaction: { to: this.router, data: "0x", value: "0", gas: 200000 }, simulation: { isSuccess: true, amountsOut: ["0"], gasEstimate: 200000 } };
  }
  async swap(tokenIn: string, tokenOut: string, amount: bigint, minOut: bigint, slippage = 0.5, userAddr?: string, receiver?: string): Promise<{ txHash: string; amountOut: bigint; pathId: string; gasUsed: number }> {
    const quote = await this.getQuote(tokenIn, tokenOut, amount, slippage, userAddr);
    const assembled = await this.assemble(quote.pathId, userAddr || "0x0", true, receiver);
    return { txHash: `0x${Date.now().toString(16)}`, amountOut: quote.outAmounts[0]!, pathId: quote.pathId, gasUsed: quote.gasEstimate };
  }
  async swapMulti(inputTokens: { token: string; amount: bigint }[], outputToken: string, minOut: bigint, slippage = 0.5): Promise<{ txHash: string; amountOut: bigint; pathId: string }> { return { txHash: `0x${Date.now().toString(16)}`, amountOut: minOut, pathId: "0x0" }; }
  async getPathViz(pathId: string): Promise<{ nodes: { address: string; symbol: string; decimals: number }[]; edges: { from: string; to: string; pool: string; percentage: number }[] }> { return { nodes: [], edges: [] }; }
  async getSupportedTokens(): Promise<{ address: string; symbol: string; decimals: number; name: string }[]> { return []; }
  async getSupportedChains(): Promise<{ chainId: number; name: string; isActive: boolean }[]> { return [{ chainId: 1, name: "Ethereum", isActive: true }, { chainId: 42161, name: "Arbitrum", isActive: true }, { chainId: 8453, name: "Base", isActive: true }]; }
  async getLiquiditySources(): Promise<{ name: string; address: string; type: string; isActive: boolean }[]> { return []; }
  async getContractInfo(): Promise<{ router: string; quoter: string; approval: string }> { return { router: this.router, quoter: "0x0", approval: "0x0" }; }
  calculatePriceImpact(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): number { return Number(amountIn) / Number(reserveIn) * 100; }
  private apiPath(): string { return this.apiUrl; }
  private async request<T>(url: string, options?: { method?: string; body?: string }): Promise<T> { return {} as T; }
}
