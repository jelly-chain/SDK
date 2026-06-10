import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";
export interface ParaswapConfig extends BaseSDKConfig { chainId: ChainId; apiUrl?: string; partner?: string }
export class ParaswapSDK extends BaseSDK {
  readonly chainId: ChainId;
  private readonly apiUrl: string;
  private readonly partner: string;
  constructor(config: ParaswapConfig) {
    super(config, `Paraswap:${config.chainId}`);
    this.chainId = config.chainId;
    this.apiUrl = config.apiUrl || "https://api.paraswap.io";
    this.partner = config.partner || "jellyos";
  }
  async getPrices(srcToken: string, destToken: string, amount: bigint, side: "SELL" | "BUY" = "SELL", network?: number, otherExchangePrices = false, partner?: string, maxImpact = 100, includeDEXS?: string[], excludeDEXS?: string[], includeContractMethods?: string[], excludeContractMethods?: string[], adapterVersion?: string, srcDecimals?: number, destDecimals?: number, permit?: string, deadline?: number, uuid?: string, onlyParams = false, simple = false): Promise<{ priceRoute: { blockNumber: number; network: number; srcToken: string; srcDecimals: number; srcAmount: string; destToken: string; destDecimals: number; destAmount: string; bestRoute: { percent: number; swaps: { srcToken: string; destToken: string; swapExchanges: { exchange: string; srcAmount: string; destAmount: string; percent: number; poolAddresses: string[]; data: { router: string; path: string[]; factory: string; initCode: string; feeFactor: number; gasUSD: string; } }[] }[] }[]; gasCost: string; gasCostUSD: string; side: string; tokenTransferProxy: string; contractAddress: string; contractMethod: string; partner: string; partnerFee: number; srcUSD: string; destUSD: string; partner: string; hmac: string }> {
    return { priceRoute: { blockNumber: 18000000, network: this.chainId, srcToken, srcDecimals: 18, srcAmount: amount.toString(), destToken, destDecimals: 18, destAmount: (amount * 995n / 1000n).toString(), bestRoute: [{ percent: 100, swaps: [{ srcToken, destToken, swapExchanges: [{ exchange: "uniswap_v3", srcAmount: amount.toString(), destAmount: (amount * 995n / 1000n).toString(), percent: 100, poolAddresses: [], data: { router: "0xE592427A0AEce92De3Edee1F18E0157C05861564", path: [srcToken, destToken], factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984", initCode: "", feeFactor: 3000, gasUSD: "5.0" } }] }] }], gasCost: "150000", gasCostUSD: "30", side, tokenTransferProxy: "0x216B4B4BaAf8fddC51d29685d01d01BA4B2c0", contractAddress: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", contractMethod: "simpleSwap", partner: this.partner, partnerFee: 0, srcUSD: "2000", destUSD: "1990", hmac: "0x0" } };
  }
  async buildTransaction(priceRoute: unknown, srcToken: string, destToken: string, srcAmount: bigint, destAmount: bigint, userAddress: string, partner?: string, partnerAddress?: string, partnerFeeBps?: number, receiver?: string, permit?: string, deadline?: number, uuid?: string, onlyParams = false, simple = false): Promise<{ from: string; to: string; data: string; value: string; chainId: number; gas: string }> {
    return { from: userAddress, to: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", data: "0x", value: "0", chainId: this.chainId, gas: "200000" };
  }
  async swap(srcToken: string, destToken: string, amount: bigint, minOut: bigint, userAddress: string, side: "SELL" | "BUY" = "SELL", slippage = 0.5): Promise<{ txHash: string; destAmount: bigint }> {
    const prices = await this.getPrices(srcToken, destToken, amount, side);
    const tx = await this.buildTransaction(prices.priceRoute, srcToken, destToken, amount, BigInt(prices.priceRoute.destAmount), userAddress);
    return { txHash: `0x${Date.now().toString(16)}`, destAmount: BigInt(prices.priceRoute.destAmount) };
  }
  async getSpender(): Promise<string> { return "0x216B4B4BaAf8fddC51d29685d01d01BA4B2c0"; }
  async getBalance(user: string, token: string): Promise<bigint> { return BigInt(1e18); }
  async getAllowance(user: string, token: string): Promise<bigint> { return 0n; }
  async approve(token: string, amount: bigint): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async getTokens(): Promise<{ address: string; symbol: string; decimals: number; img: string; network: number; chainId: number }[]> { return []; }
  async getAdapters(): Promise<{ name: string; address: string; type: string }[]> { return [{ name: "UniswapV2", address: "0x0", type: "Adapter" }, { name: "UniswapV3", address: "0x0", type: "Adapter" }, { name: "Curve", address: "0x0", type: "Adapter" }]; }
  async getGasPrice(): Promise<{ low: number; standard: number; fast: number; instant: number }> { return { low: 10e9, standard: 20e9, fast: 30e9, instant: 50e9 }; }
  async getRate(srcToken: string, destToken: string, srcAmount: bigint): Promise<{ destAmount: bigint; bestRoute: string[] }> { return { destAmount: srcAmount * 995n / 1000n, bestRoute: ["uniswap_v3"] }; }
  async getPartnerStatus(partner: string): Promise<{ name: string; status: string; fee: number; volume24h: number }> { return { name: partner, status: "active", fee: 0, volume24h: 0 }; }
  async getTransactionCount(user: string): Promise<number> { return 0; }
  async estimateGas(tx: { to: string; data: string; value: string }): Promise<number> { return 150000; }
  calculatePriceImpact(srcAmount: bigint, destAmount: bigint, srcPrice: number, destPrice: number): number { return Math.abs(Number(destAmount) * destPrice / (Number(srcAmount) * srcPrice) - 1) * 100; }
  private async request<T>(url: string, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<T> { return {} as T; }
}
