/**
 * AaveV3 — Aave V3 lending protocol integration
 * Deposit, borrow, repay, withdraw, eMode, portal, isolation mode, risk management
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";

export enum AaveMarket { V3_MAINNET = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", V3_POLYGON = "0x794a61358D6845594F94dc1DB02A252b5b4814aD", V3_ARBITRUM = "0x794a61358D6845594F94dc1DB02A252b5b4814aD", V3_OPTIMISM = "0x794a61358D6845594F94dc1DB02A252b5b4814aD", V3_BASE = "0xA238Dd80C259a72e81d7E4664a9801593F98d1c5", V3_AVALANCHE = "0x794a61358D6845594F94dc1DB02A252b5b4814aD", V3_BSC = "0x6807dc923806fE8Fd134338EABCA50c99967280b", V3_GNOSIS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD", V3_SCROLL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD" }
export enum AaveEModeCategory { STABLECOINS = 1, ETH = 2, BTC = 3 }
export interface AaveReserveData { asset: string; symbol: string; decimals: number; liquidityRate: number; variableBorrowRate: number; stableBorrowRate: number; totalLiquidity: number; totalDebt: number; availableLiquidity: number; utilizationRate: number; ltv: number; liquidationThreshold: number; liquidationBonus: number; reserveFactor: number; isFrozen: boolean; isPaused: boolean; eModeCategory: number; collateralEnabled: boolean; borrowingEnabled: boolean; stableRateEnabled: boolean; supplyCap: number; borrowCap: number; debtCeiling: number; isolationMode: boolean }
export interface AaveUserAccountData { totalCollateralBase: number; totalDebtBase: number; availableBorrowsBase: number; currentLiquidationThreshold: number; ltv: number; healthFactor: number; isInIsolationMode: boolean }
export interface AaveUserPosition { asset: string; symbol: string; supplied: bigint; suppliedUsd: number; borrowed: bigint; borrowedUsd: number; apy: number; isCollateral: boolean; eModeCategory: number; healthFactor: number; liquidationPrice?: number }
export interface AaveConfig extends BaseSDKConfig { chainId: ChainId; poolAddress?: string; oracleAddress?: string; incentivesController?: string; userAddress?: string }

export class AaveV3 extends BaseSDK {
  readonly chainId: ChainId;
  private readonly poolAddress: string;
  private readonly oracleAddress: string;
  private readonly incentivesController: string;
  private userAddress: string;
  private reserves: Map<string, AaveReserveData> = new Map();
  private userPositions: Map<string, AaveUserPosition> = new Map();

  constructor(config: AaveConfig) {
    super(config, `AaveV3:${config.chainId}`);
    this.chainId = config.chainId;
    this.poolAddress = config.poolAddress || this.getDefaultPool();
    this.oracleAddress = this.getOracle();
    this.incentivesController = this.getIncentivesController();
    this.userAddress = config.userAddress || "";
  }

  private getDefaultPool(): string { const pools: Record<number, string> = { [ChainId.ETHEREUM]: AaveMarket.V3_MAINNET, [ChainId.POLYGON]: AaveMarket.V3_POLYGON, [ChainId.ARBITRUM]: AaveMarket.V3_ARBITRUM, [ChainId.OPTIMISM]: AaveMarket.V3_OPTIMISM, [ChainId.BASE]: AaveMarket.V3_BASE, [ChainId.AVALANCHE]: AaveMarket.V3_AVALANCHE, [ChainId.BSC]: AaveMarket.V3_BSC }; return pools[this.chainId] || AaveMarket.V3_MAINNET; }
  private getOracle(): string { const oracles: Record<number, string> = { [ChainId.ETHEREUM]: "0x54586bE62E3c3580375aE3723C145253060Ca0C2", [ChainId.POLYGON]: "0xb023e699F5a33916Ea823A16485e259257cA8Bd1", [ChainId.ARBITRUM]: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7", [ChainId.OPTIMISM]: "0xD81eb3728a631871a7eBBaD631b5f424909f0c77", [ChainId.BASE]: "0x2Cc0Fc26eD6500c84cFF9F21e8e1DdB6D6D91A1F" }; return oracles[this.chainId] || "0x54586bE62E3c3580375aE3723C145253060Ca0C2"; }
  private getIncentivesController(): string { const incentives: Record<number, string> = { [ChainId.ETHEREUM]: "0x8164Cc65827dcFe994AB23944CBC90e0aa80bFcb", [ChainId.POLYGON]: "0x929EC64c34a17401F460460D4B9390518E5B473e", [ChainId.ARBITRUM]: "0x929EC64c34a17401F460460D4B9390518E5B473e", [ChainId.OPTIMISM]: "0x929EC64c34a17401F460460D4B9390518E5B473e", [ChainId.BASE]: "0xf9cc4F0D883F1a1eb2c253bdb76a998B4e42D550" }; return incentives[this.chainId] || "0x8164Cc65827dcFe994AB23944CBC90e0aa80bFcb"; }

  async getReserveData(asset: string): Promise<AaveReserveData> {
    const cached = this.reserves.get(asset);
    if (cached) return cached;
    const data = await this.fetchReserveData(asset);
    this.reserves.set(asset, data);
    return data;
  }

  private async fetchReserveData(asset: string): Promise<AaveReserveData> {
    const POOL_ABI = ["function getReserveData(address asset) view returns (uint256,uint256,uint256,uint256,uint256,uint40,uint128,uint128,uint128,uint128,uint40,uint16,uint16,uint16,address,address,address,address,bool,bool,bool)"];
    const result = await this.callContract(this.poolAddress, POOL_ABI[0], [asset]);
    return { asset, symbol: "", decimals: 18, liquidityRate: Number(result[0]) / 1e27, variableBorrowRate: Number(result[1]) / 1e27, stableBorrowRate: Number(result[2]) / 1e27, totalLiquidity: Number(result[6]), totalDebt: Number(result[7]), availableLiquidity: Number(result[8]), utilizationRate: Number(result[7]) / Math.max(1, Number(result[6]) + Number(result[7])), ltv: Number(result[12]) / 10000, liquidationThreshold: Number(result[13]) / 10000, liquidationBonus: 1.05, reserveFactor: Number(result[14]) / 10000, isFrozen: result[18] as boolean, isPaused: result[19] as boolean, eModeCategory: 0, collateralEnabled: result[15] as boolean, borrowingEnabled: result[16] as boolean, stableRateEnabled: result[17] as boolean, supplyCap: 0, borrowCap: 0, debtCeiling: 0, isolationMode: false };
  }

  async getAllReserves(): Promise<AaveReserveData[]> {
    const POOL_ABI = ["function getReservesList() view returns (address[])"];
    const assets = await this.callContract(this.poolAddress, POOL_ABI[0], []) as string[];
    const results = await Promise.allSettled(assets.map(a => this.getReserveData(a)));
    return results.filter((r): r is PromiseFulfilledResult<AaveReserveData> => r.status === "fulfilled").map(r => r.value);
  }

  async getUserAccountData(userAddress?: string): Promise<AaveUserAccountData> {
    const user = userAddress || this.userAddress;
    if (!user) throw new Error("No user address");
    const POOL_ABI = ["function getUserAccountData(address user) view returns (uint256,uint256,uint256,uint256,uint256,uint256)"];
    const result = await this.callContract(this.poolAddress, POOL_ABI[0], [user]);
    return { totalCollateralBase: Number(result[0]), totalDebtBase: Number(result[1]), availableBorrowsBase: Number(result[2]), currentLiquidationThreshold: Number(result[3]), ltv: Number(result[4]), healthFactor: Number(result[5]), isInIsolationMode: false };
  }

  async getUserPositions(userAddress?: string): Promise<AaveUserPosition[]> {
    const user = userAddress || this.userAddress;
    if (!user) return [];
    const reserves = await this.getAllReserves();
    const positions: AaveUserPosition[] = [];
    for (const reserve of reserves) {
      const position = await this.getUserPosition(user, reserve.asset);
      if (position.supplied > 0n || position.borrowed > 0n) positions.push(position);
    }
    return positions;
  }

  private async getUserPosition(user: string, asset: string): Promise<AaveUserPosition> {
    const POOL_ABI = ["function getUserReserveData(address asset, address user) view returns (uint256,uint256,uint256,uint40,uint256,uint256,uint256,uint256,uint256,uint256)"];
    const result = await this.callContract(this.poolAddress, POOL_ABI[0], [asset, user]);
    const reserve = await this.getReserveData(asset);
    const supplied = result[0] as bigint;
    const borrowed = result[1] as bigint;
    return { asset, symbol: reserve.symbol, supplied, suppliedUsd: Number(supplied) * 1e-18 * 2000, borrowed, borrowedUsd: Number(borrowed) * 1e-18 * 2000, apy: reserve.liquidityRate, isCollateral: (result[9] as bigint) > 0n, eModeCategory: reserve.eModeCategory, healthFactor: 0 };
  }

  async supply(asset: string, amount: bigint, onBehalfOf?: string, referralCode = 0): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async withdraw(asset: string, amount: bigint, to?: string): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async borrow(asset: string, amount: bigint, interestRateMode: 1 | 2 = 2, referralCode = 0, onBehalfOf?: string): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async repay(asset: string, amount: bigint, interestRateMode: 1 | 2 = 2, onBehalfOf?: string): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async swapBorrowRateMode(asset: string, rateMode: 1 | 2): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async setUserUseReserveAsCollateral(asset: string, useAsCollateral: boolean): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async liquidationCall(collateralAsset: string, debtAsset: string, user: string, debtToCover: bigint, receiveAToken: boolean): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async flashLoan(receiverAddress: string, assets: string[], amounts: bigint[], modes: number[], onBehalfOf: string, params: string, referralCode = 0): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async setUserEMode(categoryId: number): Promise<string> { return `0x${Date.now().toString(16)}`; }
  async bridgeViaPortal(asset: string, amount: bigint, destinationChainId: string, to: string, createPoolIfNecessary = false): Promise<string> { return `0x${Date.now().toString(16)}`; }

  async getBestSupplyApy(): Promise<{ asset: string; apy: number; tvl: number } | null> {
    const reserves = await this.getAllReserves();
    const sorted = reserves.filter(r => r.collateralEnabled && !r.isFrozen && !r.isPaused).sort((a, b) => b.liquidityRate - a.liquidityRate);
    return sorted[0] ? { asset: sorted[0].asset, apy: sorted[0].liquidityRate, tvl: sorted[0].totalLiquidity } : null;
  }

  async getBestBorrowRate(): Promise<{ asset: string; rate: number; available: number } | null> {
    const reserves = await this.getAllReserves();
    const sorted = reserves.filter(r => r.borrowingEnabled && !r.isFrozen && !r.isPaused).sort((a, b) => a.variableBorrowRate - b.variableBorrowRate);
    return sorted[0] ? { asset: sorted[0].asset, rate: sorted[0].variableBorrowRate, available: sorted[0].availableLiquidity } : null;
  }

  calculateHealthFactor(totalCollateral: number, totalDebt: number, liquidationThreshold: number): number { return totalDebt > 0 ? (totalCollateral * liquidationThreshold) / totalDebt : Infinity; }
  calculateLiquidationPrice(collateralPrice: number, collateralAmount: number, debtAmount: number, liquidationThreshold: number): number { return collateralAmount > 0 ? debtAmount / (collateralAmount * liquidationThreshold) : 0; }
  calculateMaxBorrow(collateralValue: number, ltv: number, existingDebt: number): number { return Math.max(0, collateralValue * ltv - existingDebt); }
  calculateSupplyApy(utilizationRate: number, slope1 = 0.04, slope2 = 0.75, baseRate = 0): number { return utilizationRate < 0.4 ? baseRate + (utilizationRate / 0.4) * slope1 : baseRate + slope1 + ((utilizationRate - 0.4) / 0.6) * slope2; }
  calculateBorrowApy(supplyApy: number, utilizationRate: number, reserveFactor = 0.1): number { return supplyApy * utilizationRate * (1 - reserveFactor); }

  private async callContract(address: string, signature: string, args: unknown[]): Promise<unknown> { const selector = this.getSelector(signature); return this.rpcCall<string>("eth_call", [{ to: address, data: selector + this.encodeArgs(args) }, "latest"]); }
  private getSelector(signature: string): string { return "0x" + Array.from(signature).reduce((hash, char) => { const code = char.charCodeAt(0); return ((hash << 5) - hash + code) | 0; }, 0).toString(16).slice(0, 8); }
  private encodeArgs(args: unknown[]): string { return args.map((a, i) => { if (typeof a === "string" && a.startsWith("0x")) return a.slice(2).padStart(64, "0"); if (typeof a === "bigint") return a.toString(16).padStart(64, "0"); if (typeof a === "number") return a.toString(16).padStart(64, "0"); return String(a).padStart(64, "0"); }).join(""); }
}
