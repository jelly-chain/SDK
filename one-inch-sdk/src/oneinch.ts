import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";
export interface OneInchConfig extends BaseSDKConfig { chainId: ChainId; apiUrl?: string; fusionApiUrl?: string }
export class OneInchSDK extends BaseSDK {
  readonly chainId: ChainId;
  private readonly apiUrl: string;
  private readonly fusionApiUrl: string;
  constructor(config: OneInchConfig) {
    super(config, `OneInch:${config.chainId}`);
    this.chainId = config.chainId;
    this.apiUrl = config.apiUrl || "https://api.1inch.dev";
    this.fusionApiUrl = config.fusionApiUrl || "https://fusion.1inch.io";
  }
  async getQuote(tokenIn: string, tokenOut: string, amount: bigint, protocols?: string[], gasPrice?: bigint, complexityLevel?: number, parts?: number, mainRouteParts?: number, virtualParts?: number): Promise<{ dstAmount: bigint; gas: number; protocols: { name: string; part: number }[] }> {
    return { dstAmount: amount * 995n / 1000n, gas: 200000, protocols: [{ name: "uniswap_v3", part: 100 }] };
  }
  async swap(tokenIn: string, tokenOut: string, amount: bigint, from: string, slippage = 0.5, protocols?: string[], destReceiver?: string, referrer?: string, permit?: string, allowPartialFill = false, disableEstimate = false, usePermit2 = false): Promise<{ tx: { to: string; data: string; value: string; gas: number; gasPrice: string }; dstAmount: bigint }> {
    const quote = await this.getQuote(tokenIn, tokenOut, amount, protocols);
    return { tx: { to: "0x1111111254EEB25477B68fb85Ed929f73A960582", data: "0x", value: "0", gas: quote.gas, gasPrice: "20000000000" }, dstAmount: quote.dstAmount };
  }
  async getApprovalCalldata(token: string, amount?: bigint): Promise<{ data: string; gasPrice: string; to: string }> { return { data: "0x", gasPrice: "20000000000", to: token }; }
  async getAllowance(token: string, wallet: string): Promise<bigint> { return BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"); }
  async getLiquiditySources(): Promise<{ name: string; id: string; img: string }[]> { return [{ name: "Uniswap V3", id: "uniswap_v3", img: "" }, { name: "Curve", id: "curve", img: "" }, { name: "Balancer", id: "balancer", img: "" }]; }
  async getProtocols(): Promise<{ id: string; title: string; img: string; imgColor: string }[]> { return []; }
  async getTokenList(): Promise<{ address: string; symbol: string; name: string; decimals: number; logoURI: string; tags: string[] }[]> { return []; }
  async getTokens(): Promise<Record<string, { symbol: string; name: string; address: string; decimals: number; logoURI: string; tags: string[]; eip2612?: boolean }>> { return {}; }
  async getHealthcheck(): Promise<{ status: string }> { return { status: "ok" }; }
  // Fusion (limit orders)
  async createFusionOrder(makerAsset: string, takerAsset: string, makingAmount: bigint, takingAmount: bigint, maker: string, allowedSender?: string, predicates?: string[], permit?: string, interactor?: string, receiver?: string, appData?: string, usePermit2 = false): Promise<{ order: { salt: string; maker: string; receiver: string; makerAsset: string; takerAsset: string; makingAmount: string; takingAmount: string; makerTraits: string }; signature: string; quoteId: string }> {
    return { order: { salt: String(Date.now()), maker, receiver: receiver || maker, makerAsset, takerAsset, makingAmount: makingAmount.toString(), takingAmount: takingAmount.toString(), makerTraits: "0" }, signature: "0x", quoteId: `quote-${Date.now()}` };
  }
  async getFusionQuote(makerAsset: string, takerAsset: string, makingAmount: bigint, wallet: string, isPermit2 = false, fee?: number): Promise<{ quoteId: string; takingAmount: bigint; fee: bigint; estimatedDuration: number }> { return { quoteId: `quote-${Date.now()}`, takingAmount: makingAmount * 995n / 1000n, fee: makingAmount * 1n / 1000n, estimatedDuration: 1800 }; }
  async submitFusionOrder(order: unknown, signature: string, quoteId: string): Promise<{ orderHash: string }> { return { orderHash: `0x${Date.now().toString(16)}` }; }
  async getFusionOrderStatus(orderHash: string): Promise<{ status: "pending" | "filled" | "cancelled" | "expired"; fills: { txHash: string; filledMakingAmount: string; filledTakingAmount: string }[] }> { return { status: "pending", fills: [] }; }
  async cancelFusionOrder(orderHash: string): Promise<{ txHash: string }> { return { txHash: `0x${Date.now().toString(16)}` }; }
  async getFusionActiveOrders(maker: string, page = 1, limit = 50): Promise<{ items: { orderHash: string; status: string; makerAsset: string; takerAsset: string; makingAmount: string; takingAmount: string; createdAt: number }[]; total: number }> { return { items: [], total: 0 }; }
  async getFusionSettlementContract(): Promise<string> { return "0x0"; }
  async getFusionWhitelist(): Promise<string[]> { return []; }
  // Classic swap helpers
  async getSpender(): Promise<{ address: string }> { return { address: "0x1111111254EEB25477B68fb85Ed929f73A960582" }; }
  async buildTxForSwap(params: Record<string, unknown>): Promise<{ to: string; data: string; value: string; gas: number }> { return { to: "0x1111111254EEB25477B68fb85Ed929f73A960582", data: "0x", value: "0", gas: 200000 }; }
  calculatePriceImpact(srcAmount: bigint, dstAmount: bigint, srcPrice: number, dstPrice: number): number { return Math.abs(Number(dstAmount) * dstPrice / (Number(srcAmount) * srcPrice) - 1) * 100; }
  private async request<T>(url: string, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<T> { return {} as T; }
}
