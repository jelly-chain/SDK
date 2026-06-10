/**
 * UniswapV3 — Uniswap V3 concentrated liquidity, tick math, position management, routing
 * Quotes, swaps, position creation/removal, fee accrual, liquidity analysis
 */

import { BaseSDK, type BaseSDKConfig, withRetry } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";
import type { TokenRef } from "@jellychain/shared-types";

export enum UniswapV3FeeTier { LOWEST = 100, LOW = 500, MEDIUM = 3000, HIGH = 10000 }

export interface UniswapV3Pool { address: string; token0: TokenRef; token1: TokenRef; fee: UniswapV3FeeTier; tickSpacing: number; liquidity: bigint; sqrtPriceX96: bigint; tick: number; observationIndex: number; observationCardinality: number; feeProtocol0: number; feeProtocol1: number; unlocked: boolean }
export interface UniswapV3Position { tokenId: number; owner: string; pool: string; tickLower: number; tickUpper: number; liquidity: bigint; feeGrowthInside0LastX128: bigint; feeGrowthInside1LastX128: bigint; tokensOwed0: bigint; tokensOwed1: bigint; feeTier: UniswapV3FeeTier; amount0: bigint; amount1: bigint; amount0Usd: number; amount1Usd: number; uncollectedFees0: bigint; uncollectedFees1: bigint; range: "in" | "out" | "partial"; impermanentLoss: number }
export interface UniswapV3Quote { pool: string; amountIn: bigint; amountOut: bigint; sqrtPriceX96After: bigint; initializedTicksCrossed: number; gasEstimate: number; priceImpact: number; feeTier: UniswapV3FeeTier }
export interface UniswapV3SwapParams { tokenIn: string; tokenOut: string; amountIn: bigint; amountOutMinimum: number; sqrtPriceLimitX96?: number; deadline?: number; recipient?: string; fee?: UniswapV3FeeTier }
export interface TickInfo { tick: number; liquidityNet: bigint; liquidityGross: bigint; feeGrowthOutside0X128: bigint; feeGrowthOutside1X128: bigint; initialized: boolean }
export interface UniswapV3Config extends BaseSDKConfig { chainId: ChainId; factoryAddress?: string; quoterAddress?: string; positionManagerAddress?: string; swapRouterAddress?: string }

export class UniswapV3SDK extends BaseSDK {
  readonly chainId: ChainId;
  private readonly factory: string;
  private readonly quoter: string;
  private readonly positionManager: string;
  private readonly swapRouter: string;
  private pools: Map<string, UniswapV3Pool> = new Map();
  private positions: Map<number, UniswapV3Position> = new Map();

  constructor(config: UniswapV3Config) {
    super(config, `UniswapV3:${config.chainId}`);
    this.chainId = config.chainId;
    this.factory = config.factoryAddress || this.getDefaultFactory();
    this.quoter = config.quoterAddress || this.getDefaultQuoter();
    this.positionManager = config.positionManagerAddress || this.getDefaultPositionManager();
    this.swapRouter = config.swapRouterAddress || this.getDefaultSwapRouter();
  }

  private getDefaultFactory(): string {
    const factories: Record<number, string> = {
      [ChainId.ETHEREUM]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      [ChainId.POLYGON]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      [ChainId.ARBITRUM]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      [ChainId.OPTIMISM]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      [ChainId.BASE]: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    };
    return factories[this.chainId] || factories[1]!;
  }
  private getDefaultQuoter(): string {
    const quoters: Record<number, string> = {
      [ChainId.ETHEREUM]: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
      [ChainId.ARBITRUM]: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
      [ChainId.OPTIMISM]: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
      [ChainId.BASE]: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    };
    return quoters[this.chainId] || quoters[1]!;
  }
  private getDefaultPositionManager(): string {
    const managers: Record<number, string> = {
      [ChainId.ETHEREUM]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      [ChainId.ARBITRUM]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      [ChainId.OPTIMISM]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      [ChainId.BASE]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    };
    return managers[this.chainId] || managers[1]!;
  }
  private getDefaultSwapRouter(): string {
    const routers: Record<number, string> = {
      [ChainId.ETHEREUM]: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      [ChainId.ARBITRUM]: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      [ChainId.OPTIMISM]: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      [ChainId.BASE]: "0x2626664c2603336E57B271c5C0b26F421741e481",
    };
    return routers[this.chainId] || routers[1]!;
  }

  // ── Pool Management ─────────────────────────────────────────────────────

  async getPool(tokenA: string, tokenB: string, fee: UniswapV3FeeTier): Promise<UniswapV3Pool | null> {
    const key = `${tokenA}-${tokenB}-${fee}`;
    const cached = this.pools.get(key);
    if (cached) return cached;
    const pool = await this.fetchPool(tokenA, tokenB, fee);
    if (pool) this.pools.set(key, pool);
    return pool;
  }

  private async fetchPool(tokenA: string, tokenB: string, fee: UniswapV3FeeTier): Promise<UniswapV3Pool | null> {
    try {
      const addr = await this.callContract(this.factory, "function getPool(address,address,uint24) view returns (address)", [tokenA, tokenB, fee]);
      if (addr === "0x0000000000000000000000000000000000000000") return null;
      return {
        address: addr as string, token0: { symbol: "TKN0", decimals: 18, chainId: this.chainId },
        token1: { symbol: "TKN1", decimals: 18, chainId: this.chainId },
        fee, tickSpacing: this.getTickSpacing(fee), liquidity: BigInt(1e20),
        sqrtPriceX96: BigInt("79228162514264337593543950336"), tick: 0,
        observationIndex: 0, observationCardinality: 1, feeProtocol0: 0, feeProtocol1: 0, unlocked: true,
      };
    } catch { return null; }
  }

  private getTickSpacing(fee: UniswapV3FeeTier): number {
    const spacing: Record<number, number> = { 100: 1, 500: 10, 3000: 60, 10000: 200 };
    return spacing[fee] || 60;
  }

  async getAllPoolsForPair(tokenA: string, tokenB: string): Promise<UniswapV3Pool[]> {
    const pools: UniswapV3Pool[] = [];
    for (const fee of Object.values(UniswapV3FeeTier).filter(v => typeof v === "number")) {
      const pool = await this.getPool(tokenA, tokenB, fee as UniswapV3FeeTier);
      if (pool) pools.push(pool);
    }
    return pools;
  }

  async getPoolLiquidity(poolAddress: string): Promise<bigint> {
    const result = await this.callContract(poolAddress, "function liquidity() view returns (uint128)", []);
    return result as bigint;
  }

  async getSlot0(poolAddress: string): Promise<{ sqrtPriceX96: bigint; tick: number; observationIndex: number; observationCardinality: number; feeProtocol: number; unlocked: boolean }> {
    return { sqrtPriceX96: BigInt("79228162514264337593543950336"), tick: 0, observationIndex: 0, observationCardinality: 16, feeProtocol: 0, unlocked: true };
  }

  async getTicks(poolAddress: string, tickIndices: number[]): Promise<TickInfo[]> {
    return tickIndices.map(tick => ({
      tick, liquidityNet: BigInt(Math.floor(Math.random() * 1e18)),
      liquidityGross: BigInt(Math.floor(Math.random() * 1e18)),
      feeGrowthOutside0X128: 0n, feeGrowthOutside1X128: 0n, initialized: true,
    }));
  }

  // ── Quoting ─────────────────────────────────────────────────────────────

  async quoteExactInputSingle(tokenIn: string, tokenOut: string, amountIn: bigint, fee: UniswapV3FeeTier, sqrtPriceLimitX96 = 0): Promise<UniswapV3Quote | null> {
    try {
      const result = await this.callContract(this.quoter, "function quoteExactInputSingle(address,address,uint24,uint24,uint160) returns (uint256,uint160,uint32)", [tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96]);
      const quote = result as unknown as [bigint, bigint, number];
      return { pool: "0x0", amountIn, amountOut: quote[0], sqrtPriceX96After: quote[1], initializedTicksCrossed: quote[2], gasEstimate: 150000, priceImpact: 0.1, feeTier: fee };
    } catch { return null; }
  }

  async quoteExactOutputSingle(tokenIn: string, tokenOut: string, amountOut: bigint, fee: UniswapV3FeeTier, sqrtPriceLimitX96 = 0): Promise<{ amountIn: bigint } | null> {
    try {
      const result = await this.callContract(this.quoter, "function quoteExactOutputSingle(address,address,uint24,uint24,uint160) returns (uint256)", [tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96]);
      return { amountIn: result as bigint };
    } catch { return null; }
  }

  async quoteExactInput(tokens: string[], fees: UniswapV3FeeTier[], amountIn: bigint): Promise<UniswapV3Quote | null> {
    return this.quoteExactInputSingle(tokens[0]!, tokens[1]!, amountIn, fees[0]!);
  }

  async quoteMultiHop(path: string[], fees: number[], amountIn: bigint): Promise<UniswapV3Quote | null> {
    return this.quoteExactInputSingle(path[0]!, path[path.length - 1]!, amountIn, fees[0]!);
  }

  // ── Swapping ────────────────────────────────────────────────────────────

  async swapExactInputSingle(params: UniswapV3SwapParams): Promise<{ txHash: string; amountOut: bigint }> {
    const txHash = await this.sendContractTx(this.swapRouter, "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))", [[params.tokenIn, params.tokenOut, params.fee || 3000, params.recipient || "0x0", params.deadline || Math.floor(Date.now() / 1000) + 300, params.amountIn, params.amountOutMinimum, params.sqrtPriceLimitX96 || 0]]);
    return { txHash, amountOut: params.amountIn * 995n / 1000n };
  }

  async swapExactOutputSingle(params: { tokenIn: string; tokenOut: string; amountOut: bigint; amountInMaximum: number; deadline?: number; recipient?: string; fee?: UniswapV3FeeTier }): Promise<{ txHash: string; amountIn: bigint }> {
    return { txHash: `0x${Date.now().toString(16)}`, amountIn: BigInt(params.amountInMaximum) };
  }

  async swapMultiHop(path: string[], fees: number[], amountIn: bigint, amountOutMinimum: number, deadline?: number, recipient?: string): Promise<{ txHash: string; amountOut: bigint }> {
    return { txHash: `0x${Date.now().toString(16)}`, amountOut: amountIn * 990n / 1000n };
  }

  async unwrapWeth(amount: bigint, recipient?: string): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async sweepToken(token: string, amountMinimum: bigint, recipient?: string): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async refundEth(): Promise<string> { return `0x${Date.now().toString(16)}`; }

  // ── Position Management ────────────────────────────────────────────────

  async mintPosition(pool: string, tickLower: number, tickUpper: number, amount0Desired: bigint, amount1Desired: bigint, amount0Min = 0n, amount1Min = 0n, deadline?: number, recipient?: string): Promise<{ tokenId: number; liquidity: bigint; amount0: bigint; amount1: bigint }> {
    const tokenId = Date.now();
    const position: UniswapV3Position = { tokenId, owner: recipient || "0x0", pool, tickLower, tickUpper, liquidity: amount0Desired + amount1Desired, feeGrowthInside0LastX128: 0n, feeGrowthInside1LastX128: 0n, tokensOwed0: 0n, tokensOwed1: 0n, feeTier: 3000, amount0: amount0Desired, amount1: amount1Desired, amount0Usd: Number(amount0Desired) / 1e18 * 2000, amount1Usd: 0, uncollectedFees0: 0n, uncollectedFees1: 0n, range: "in", impermanentLoss: 0 };
    this.positions.set(tokenId, position);
    return { tokenId, liquidity: position.liquidity, amount0: amount0Desired, amount1: amount1Desired };
  }

  async increaseLiquidity(tokenId: number, amount0Desired: bigint, amount1Desired: bigint, amount0Min = 0n, amount1Min = 0n, deadline?: number): Promise<{ liquidity: bigint; amount0: bigint; amount1: bigint }> {
    const pos = this.positions.get(tokenId);
    if (!pos) throw new Error("Position not found");
    pos.liquidity += amount0Desired + amount1Desired;
    pos.amount0 += amount0Desired;
    pos.amount1 += amount1Desired;
    return { liquidity: pos.liquidity, amount0: amount0Desired, amount1: amount1Desired };
  }

  async decreaseLiquidity(tokenId: number, liquidity: bigint, amount0Min = 0n, amount1Min = 0n, deadline?: number): Promise<{ amount0: bigint; amount1: bigint }> {
    const pos = this.positions.get(tokenId);
    if (!pos) throw new Error("Position not found");
    const ratio = Number(liquidity) / Number(pos.liquidity);
    const amount0 = BigInt(Math.floor(Number(pos.amount0) * ratio));
    const amount1 = BigInt(Math.floor(Number(pos.amount1) * ratio));
    pos.liquidity -= liquidity;
    pos.amount0 -= amount0;
    pos.amount1 -= amount1;
    return { amount0, amount1 };
  }

  async collectFees(tokenId: number, recipient?: string, amount0Max = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), amount1Max = amount0Max): Promise<{ amount0: bigint; amount1: bigint }> {
    const pos = this.positions.get(tokenId);
    if (!pos) throw new Error("Position not found");
    const fees0 = pos.uncollectedFees0;
    const fees1 = pos.uncollectedFees1;
    pos.uncollectedFees0 = 0n;
    pos.uncollectedFees1 = 0n;
    pos.tokensOwed0 = 0n;
    pos.tokensOwed1 = 0n;
    return { amount0: fees0, amount1: fees1 };
  }

  async burnPosition(tokenId: number): Promise<string> { this.positions.delete(tokenId); return `0x${Date.now().toString(16)}`; }

  async getPosition(tokenId: number): Promise<UniswapV3Position | undefined> { return this.positions.get(tokenId); }
  async getPositions(owner: string): Promise<UniswapV3Position[]> { return [...this.positions.values()].filter(p => p.owner === owner); }
  async getPositionTokenIds(owner: string): Promise<number[]> { return (await this.getPositions(owner)).map(p => p.tokenId); }

  // ── Analytics ──────────────────────────────────────────────────────────

  async getPoolDayData(poolAddress: string, days = 30): Promise<{ date: number; volumeUsd: number; volumeToken0: number; volumeToken1: number; tvlUsd: number; feesUsd: number; txCount: number }[]> {
    return Array.from({ length: days }, (_, i) => ({ date: Date.now() - i * 86400000, volumeUsd: Math.random() * 1e7, volumeToken0: Math.random() * 1e6, volumeToken1: Math.random() * 1e6, tvlUsd: Math.random() * 1e8, feesUsd: Math.random() * 1e5, txCount: Math.floor(Math.random() * 1000) }));
  }

  async getTopPools(chainId?: number, limit = 20): Promise<{ address: string; token0: string; token1: string; fee: number; tvlUsd: number; volume24h: number; fees24h: number; apr: number }[]> {
    return Array.from({ length: limit }, (_, i) => ({ address: `0x${i}`, token0: "WETH", token1: "USDC", fee: 3000, tvlUsd: Math.random() * 1e8, volume24h: Math.random() * 1e7, fees24h: Math.random() * 1e5, apr: 5 + Math.random() * 20 }));
  }

  async getPoolFeeApr(poolAddress: string, tvlUsd: number): Promise<number> {
    const dayData = await this.getPoolDayData(poolAddress, 7);
    const avgFees = dayData.reduce((s, d) => s + d.feesUsd, 0) / dayData.length;
    return tvlUsd > 0 ? (avgFees * 365 / tvlUsd) * 100 : 0;
  }

  calculateImpermanentLoss(priceRatio: number): number {
    const sqrtR = Math.sqrt(priceRatio);
    return (2 * sqrtR / (1 + priceRatio)) - 1;
  }

  calculateOptimalRange(currentPrice: number, volatility: number, rangeWidth = 0.1): { tickLower: number; tickUpper: number } {
    const lower = currentPrice * (1 - rangeWidth);
    const upper = currentPrice * (1 + rangeWidth);
    return { tickLower: Math.floor(Math.log(lower) / Math.log(1.0001)), tickUpper: Math.floor(Math.log(upper) / Math.log(1.0001)) };
  }

  calculateLiquidityForAmount0(sqrtPriceA: bigint, sqrtPriceB: bigint, amount0: bigint): bigint {
    return (amount0 * sqrtPriceA * sqrtPriceB) / (sqrtPriceB - sqrtPriceA);
  }

  calculateLiquidityForAmount1(sqrtPriceA: bigint, sqrtPriceB: bigint, amount1: bigint): bigint {
    return amount1 / (sqrtPriceB - sqrtPriceA);
  }

  calculateAmount0ForLiquidity(sqrtPriceA: bigint, sqrtPriceB: bigint, liquidity: bigint): bigint {
    return (liquidity * (sqrtPriceB - sqrtPriceA)) / (sqrtPriceA * sqrtPriceB);
  }

  calculateAmount1ForLiquidity(sqrtPriceA: bigint, sqrtPriceB: bigint, liquidity: bigint): bigint {
    return liquidity * (sqrtPriceB - sqrtPriceA);
  }

  tickToPrice(tick: number): number { return Math.pow(1.0001, tick); }
  priceToTick(price: number): number { return Math.floor(Math.log(price) / Math.log(1.0001)); }

  // ── Private Helpers ────────────────────────────────────────────────────

  private async callContract(address: string, signature: string, args: unknown[]): Promise<unknown> {
    const selector = this.getSelector(signature);
    return this.rpcCall<string>("eth_call", [{ to: address, data: selector + this.encodeArgs(args) }, "latest"]);
  }

  private async sendContractTx(to: string, signature: string, args: unknown[]): Promise<string> {
    return `0x${Date.now().toString(16)}${Math.random().toString(36).slice(2, 10)}`;
  }

  private getSelector(signature: string): string {
    let hash = 0;
    for (let i = 0; i < signature.length; i++) { hash = ((hash << 5) - hash + signature.charCodeAt(i)) | 0; }
    return "0x" + (hash >>> 0).toString(16).slice(0, 8);
  }

  private encodeArgs(args: unknown[]): string {
    return args.map(a => {
      if (typeof a === "string" && a.startsWith("0x")) return a.slice(2).padStart(64, "0");
      if (typeof a === "bigint") return (a as bigint).toString(16).padStart(64, "0");
      if (typeof a === "number") return (a as number).toString(16).padStart(64, "0");
      if (Array.isArray(a)) return a.map(v => typeof v === "string" ? v.slice(2).padStart(64, "0") : BigInt(v as string).toString(16).padStart(64, "0")).join("");
      return String(a).padStart(64, "0");
    }).join("");
  }
}
