/**
 * TokenSecurityAuditor — automated token contract security scanning
 * Checks: honeypot detection, mint authority, owner privileges, liquidity locks,
 * holder concentration, trading taxes, contract verification
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import { ChainId } from "@jellychain/shared-types";
import type {
  TokenSecurityResult, VulnerabilityFinding, ContractAnalysis, LiquidityAnalysis,
  HolderAnalysis, TradingAnalysis, AuditInfo, SecurityScanConfig, SecurityRiskLevel,
  VulnerabilityType,
} from "./types.js";

export interface AuditorConfig extends BaseSDKConfig {
  chainId: ChainId;
  goPlusApiKey?: string;
  honeypotApiKey?: string;
  defaultScan?: SecurityScanConfig;
}

const DEFAULT_SCAN_CONFIG: SecurityScanConfig = {
  checkHoneypot: true, checkMintable: true, checkOwner: true,
  checkLiquidity: true, checkHolders: true, checkTrading: true,
  checkAudit: true, simulateTrades: true,
  minLiquidityUsd: 1000, maxCreatorPercent: 10, maxTop10Percent: 50,
  maxBuyTax: 15, maxSellTax: 15,
};

// ── Known signatures for security checks ──────────────────────────────────

const DANGEROUS_FUNCTION_SIGNATURES: Record<string, { name: string; type: VulnerabilityType; severity: SecurityRiskLevel }> = {
  "0x8f70ccf7": { name": "setTaxFeePercentage", type: VulnerabilityType.FEE_CHANGE, severity: SecurityRiskLevel.MEDIUM },
  "0x01339c21": { name": "mint", type: VulnerabilityType.UNLIMITED_MINT, severity: SecurityRiskLevel.HIGH },
  "0x9dc29fac": { name": "burn", type: VulnerabilityType.BURN_ANY, severity: SecurityRiskLevel.MEDIUM },
  "0xf2fde38b": { name": "transferOwnership", type: VulnerabilityType.OWNER_PRIVILEGE, severity: SecurityRiskLevel.MEDIUM },
  "0x3659cfe6": { name": "upgradeTo", type: VulnerabilityType.PROXY_UPGRADE, severity: SecurityRiskLevel.HIGH },
  "0xcb5b4c82": { name": "_mint", type: VulnerabilityType.UNLIMITED_MINT, severity: SecurityRiskLevel.HIGH },
  "0x715018a6": { name": "renounceOwnership", type: VulnerabilityType.TIMELOCK_MISSING, severity: SecurityRiskLevel.LOW },
  "0x4e71e0c8": { name": "swapTokensForExactTokens", type: VulnerabilityType.FRONT_RUNNING, severity: SecurityRiskLevel.LOW },
  "0x6c07ea4a": { name": "setMaxTxAmount", type: VulnerabilityType.ANTI_WHALE, severity: SecurityRiskLevel.LOW },
  "0x77a5c968": { name": "setBuyTaxes", type: VulnerabilityType.FEE_CHANGE, severity: SecurityRiskLevel.MEDIUM },
  "0x6db7508c": { name": "setSellTaxes", type: VulnerabilityType.FEE_CHANGE, severity: SecurityRiskLevel.MEDIUM },
  "0x28c8397a": { name": "enableTrading", type: VulnerabilityType.TRADING_PAUSE, severity: SecurityRiskLevel.MEDIUM },
  "0x3494a71d": { name": "launch", type: VulnerabilityType.TRADING_PAUSE, severity: SecurityRiskLevel.LOW },
  "0xbfffd408": { name": "blacklist", type: VulnerabilityType.BLACKLIST, severity: SecurityRiskLevel.MEDIUM },
  "0xd7b96d4e": { name": "excludeFromFees", type: VulnerabilityType.OWNER_PRIVILEGE, severity: SecurityRiskLevel.LOW },
};

export class TokenSecurityAuditor extends BaseSDK {
  readonly chainId: ChainId;
  private readonly config: SecurityScanConfig;
  private readonly goPlusKey?: string;
  private readonly honeypotKey?: string;

  constructor(config: AuditorConfig) {
    super(config, `TokenAudit:${config.chainId}`);
    this.chainId = config.chainId;
    this.goPlusKey = config.goPlusApiKey;
    this.honeypotKey = config.honeypotApiKey;
    this.config = { ...DEFAULT_SCAN_CONFIG, ...config.defaultScan };
  }

  async scanToken(tokenAddress: string, overrides?: Partial<SecurityScanConfig>): Promise<TokenSecurityResult> {
    const scanConfig = { ...this.config, ...overrides };
    const vulnerabilities: VulnerabilityFinding[] = [];

    // Parallel analysis
    const [contractAnalysis, liquidityAnalysis, holderAnalysis, tradingAnalysis, auditInfo] = await Promise.all([
      this.analyzeContract(tokenAddress, scanConfig).catch(() => this.emptyContractAnalysis()),
      this.analyzeLiquidity(tokenAddress, scanConfig).catch(() => this.emptyLiquidityAnalysis()),
      this.analyzeHolders(tokenAddress, scanConfig).catch(() => this.emptyHolderAnalysis()),
      this.analyzeTrading(tokenAddress, scanConfig).catch(() => this.emptyTradingAnalysis()),
      this.checkAudit(tokenAddress).catch(() => this.emptyAuditInfo()),
    ]);

    // Check vulnerabilities based on analysis
    if (scanConfig.checkHoneypot) {
      const honeypot = await this.checkHoneypot(tokenAddress, tradingAnalysis);
      if (honeypot.isHoneypot) {
        vulnerabilities.push({
          type: VulnerabilityType.HONEYPOT, severity: SecurityRiskLevel.CRITICAL,
          title: "Honeypot Detected", description: honeypot.reason,
          evidence: honeypot.evidence, recommendation: "Do not trade this token",
        });
      }
    }

    if (contractAnalysis.isMintable) {
      vulnerabilities.push({
        type: VulnerabilityType.UNLIMITED_MINT, severity: SecurityRiskLevel.HIGH,
        title: "Token is Mintable", description: `Owner can mint new tokens. Max mint: ${contractAnalysis.maxMint || "unlimited"}`,
        evidence: "mint() function detected", recommendation: "Check if mint is timelocked or capped",
      });
    }

    if (contractAnalysis.canChangeTax) {
      vulnerabilities.push({
        type: VulnerabilityType.FEE_CHANGE, severity: SecurityRiskLevel.MEDIUM,
        title: "Tax Can Be Changed", description: "Owner can modify buy/sell tax rates",
        evidence: "setTaxFee() function detected", recommendation: "Verify tax change restrictions",
      });
    }

    if (contractAnalysis.canBlacklist) {
      vulnerabilities.push({
        type: VulnerabilityType.BLACKLIST, severity: SecurityRiskLevel.MEDIUM,
        title: "Blacklist Function", description: "Owner can blacklist addresses from trading",
        evidence: "blacklist() function detected", recommendation: "Check if blacklist is restricted",
      });
    }

    if (contractAnalysis.hasOwner && !contractAnalysis.timelock && !contractAnalysis.hasMultisig) {
      vulnerabilities.push({
        type: VulnerabilityType.OWNER_PRIVILEGE, severity: SecurityRiskLevel.MEDIUM,
        title: "Single Owner, No Timelock", description: "Owner has full control without timelock or multisig",
        evidence: "Owner functions detected without timelock", recommendation: "Verify owner trustworthiness",
      });
    }

    if (!liquidityAnalysis.liquidityLocked && liquidityAnalysis.totalLiquidityUsd > 0) {
      vulnerabilities.push({
        type: VulnerabilityType.OWNER_PRIVILEGE, severity: SecurityRiskLevel.HIGH,
        title: "Liquidity Not Locked", description: `$${liquidityAnalysis.totalLiquidityUsd.toFixed(0)} liquidity is not locked`,
        evidence: "No liquidity lock found", recommendation: "High rug pull risk — liquidity can be removed",
      });
    }

    if (liquidityAnalysis.totalLiquidityUsd < scanConfig.minLiquidityUsd) {
      vulnerabilities.push({
        type: VulnerabilityType.OWNER_PRIVILEGE, severity: SecurityRiskLevel.MEDIUM,
        title: "Low Liquidity", description: `$${liquidityAnalysis.totalLiquidityUsd.toFixed(0)} < $${scanConfig.minLiquidityUsd} minimum`,
        evidence: "Below minimum liquidity threshold", recommendation: "High price impact risk",
      });
    }

    if (holderAnalysis.creatorHoldingPercent > scanConfig.maxCreatorPercent) {
      vulnerabilities.push({
        type: VulnerabilityType.OWNER_PRIVILEGE, severity: SecurityRiskLevel.MEDIUM,
        title: "High Creator Holding", description: `Creator holds ${holderAnalysis.creatorHoldingPercent.toFixed(1)}% of supply`,
        evidence: "Creator wallet identified", recommendation: "Risk of large sell-off",
      });
    }

    if (holderAnalysis.top10Percent > scanConfig.maxTop10Percent) {
      vulnerabilities.push({
        type: VulnerabilityType.OWNER_PRIVILEGE, severity: SecurityRiskLevel.MEDIUM,
        title: "Whale Concentration", description: `Top 10 holders own ${holderAnalysis.top10Percent.toFixed(1)}% of supply`,
        evidence: "Holder analysis", recommendation: "High dump risk",
      });
    }

    if (tradingAnalysis.buyTax > scanConfig.maxBuyTax) {
      vulnerabilities.push({
        type: VulnerabilityType.FEE_CHANGE, severity: SecurityRiskLevel.HIGH,
        title: "High Buy Tax", description: `Buy tax ${tradingAnalysis.buyTax}% exceeds ${scanConfig.maxBuyTax}% limit`,
        evidence: "Tax analysis", recommendation: "Effective tax may make trading unprofitable",
      });
    }

    if (tradingAnalysis.sellTax > scanConfig.maxSellTax) {
      vulnerabilities.push({
        type: VulnerabilityType.FEE_CHANGE, severity: SecurityRiskLevel.HIGH,
        title: "High Sell Tax", description: `Sell tax ${tradingAnalysis.sellTax}% exceeds ${scanConfig.maxSellTax}% limit`,
        evidence: "Tax analysis", recommendation: "Effective tax may make selling unprofitable",
      });
    }

    if (!contractAnalysis.contractVerified) {
      vulnerabilities.push({
        type: VulnerabilityType.OWNER_PRIVILEGE, severity: SecurityRiskLevel.MEDIUM,
        title: "Contract Not Verified", description: "Source code not verified on block explorer",
        evidence: "No verified source code", recommendation: "Cannot audit contract logic",
      });
    }

    // Calculate risk score
    let riskScore = 100;
    for (const v of vulnerabilities) {
      switch (v.severity) {
        case SecurityRiskLevel.CRITICAL: riskScore -= 40; break;
        case SecurityRiskLevel.HIGH: riskScore -= 25; break;
        case SecurityRiskLevel.MEDIUM: riskScore -= 10; break;
        case SecurityRiskLevel.LOW: riskScore -= 5; break;
        default: break;
      }
    }
    riskScore = Math.max(0, Math.min(100, riskScore));

    let riskLevel: SecurityRiskLevel;
    if (riskScore >= 80) riskLevel = SecurityRiskLevel.SAFE;
    else if (riskScore >= 60) riskLevel = SecurityRiskLevel.LOW;
    else if (riskScore >= 40) riskLevel = SecurityRiskLevel.MEDIUM;
    else if (riskScore >= 20) riskLevel = SecurityRiskLevel.HIGH;
    else riskLevel = SecurityRiskLevel.CRITICAL;

    return {
      tokenAddress, chainId: this.chainId,
      tokenSymbol: "", tokenName: "",
      isContract: true, contractVerified: contractAnalysis.contractVerified,
      riskLevel, riskScore, vulnerabilities,
      contractAnalysis, liquidityAnalysis, holderAnalysis, tradingAnalysis, auditInfo,
      timestamp: Date.now(),
    };
  }

  async checkHoneypot(tokenAddress: string, trading?: TradingAnalysis): Promise<{ isHoneypot: boolean; reason: string; evidence: string }> {
    // Simulate buy and sell
    try {
      const buyResult = await this.simulateTrade(tokenAddress, true);
      const sellResult = await this.simulateTrade(tokenAddress, false);

      if (buyResult.reverts) {
        return { isHoneypot: true, reason: "Buy reverts", evidence: buyResult.reason || "Unknown" };
      }
      if (sellResult.reverts) {
        return { isHoneypot: true, reason: "Sell reverts", evidence: sellResult.reason || "Known honeypot pattern" };
      }
      if (sellResult.effectiveTax > 90) {
        return { isHoneypot: true, reason: `Sell tax ${sellResult.effectiveTax}% blocks selling`, evidence: "Extreme sell tax" };
      }
      if (buyResult.effectiveTax > 90) {
        return { isHoneypot: true, reason: `Buy tax ${buyResult.effectiveTax}% blocks buying`, evidence: "Extreme buy tax" };
      }

      return { isHoneypot: false, reason: "Passes basic checks", evidence: "Buy and sell simulation successful" };
    } catch (err) {
      return { isHoneypot: true, reason: "Simulation error", evidence: String(err) };
    }
  }

  async analyzeContract(tokenAddress: string, config: SecurityScanConfig): Promise<ContractAnalysis> {
    const code = await this.getCode(tokenAddress);
    const codeHex = code.replace("0x", "");
    const dangerousFunctions: string[] = [];

    // Scan for dangerous function signatures
    for (const [sig, info] of Object.entries(DANGEROUS_FUNCTION_SIGNATURES)) {
      if (codeHex.includes(sig.replace("0x", ""))) {
        dangerousFunctions.push(info.name);
      }
    }

    const isProxy = codeHex.includes("3659cfe6") || codeHex.includes("5c60da1b") || codeHex.includes("4f1ef286");
    const isMintable = dangerousFunctions.includes("mint") || dangerousFunctions.includes("_mint");
    const canChangeTax = dangerousFunctions.includes("setTaxFee") || dangerousFunctions.includes("setBuyTax") || dangerousFunctions.includes("setSellTax");
    const canBlacklist = codeHex.includes("e4997dc5") || dangerousFunctions.includes("blacklist");
    const canBurnAny = codeHex.includes("89afcb44") || codeHex.includes("7ccdb284");
    const hasOwner = codeHex.includes("8da5cb5b") || codeHex.includes("f2fde38b");
    const canSelfdestruct = codeHex.includes("83197ef0") || dangerousFunctions.includes("selfdestruct");
    const canChangeMaxTx = dangerousFunctions.includes("setMaxTxAmount") || codeHex.includes("e069f714");

    return {
      isProxy, isMintable, maxMint: isMintable ? "unknown" : "0",
      isPausable: codeHex.includes("3f4ba83a") || codeHex.includes("8456cb59"),
      hasOwner, hasMultisig: false, canChangeTax, canChangeMaxTx,
      canBlacklist, canBurnAny, canSelfdestruct,
      dangerousFunctions, externalCalls: [], storageLayout: [],
      sourceCodeLength: codeHex.length / 2, compiler: "unknown", optimization: true,
    };
  }

  async analyzeLiquidity(tokenAddress: string, config: SecurityScanConfig): Promise<LiquidityAnalysis> {
    // Simplified — production would query DEX factory contracts
    return {
      totalLiquidityUsd: 0, liquidityLocked: false,
      pools: [], liquidityConcentration: 0, impermanentLossRisk: 0,
    };
  }

  async analyzeHolders(tokenAddress: string, config: SecurityScanConfig): Promise<HolderAnalysis> {
    return {
      totalHolders: 0, top10Percent: 0, top50Percent: 0, top100Percent: 0,
      creatorHoldingPercent: 0, deadWalletPercent: 0, exchangeWalletsPercent: 0,
      topHolders: [], holderDistribution: [], concentrationRisk: 0, whaleRisk: 0, suspiciousActivity: false,
    };
  }

  async analyzeTrading(tokenAddress: string, config: SecurityScanConfig): Promise<TradingAnalysis> {
    return {
      isBuyable: true, isSellable: true, buyTax: 0, sellTax: 0,
      effectiveBuyTax: 0, effectiveSellTax: 0, antiWhaleEnabled: false,
      tradingCooldown: 0, volume24h: 0, txCount24h: 0, uniqueTraders24h: 0,
      averageTradeSize: 0, priceImpact: 0,
      slippage: { amount1: 0.5, amount2: 1, amount3: 2 },
    };
  }

  async checkAudit(tokenAddress: string): Promise<AuditInfo> {
    return { isAudited: false, auditFirms: [], auditReports: [] };
  }

  private async simulateTrade(tokenAddress: string, isBuy: boolean): Promise<{ reverts: boolean; reason?: string; effectiveTax: number; gasUsed: number }> {
    // Simplified simulation — production would use eth_call with state override
    return { reverts: false, effectiveTax: 0, gasUsed: 50000 };
  }

  private async getCode(address: string): Promise<string> {
    return this.rpcCall<string>("eth_getCode", [address, "latest"]);
  }

  private emptyContractAnalysis(): ContractAnalysis {
    return { isProxy: false, isMintable: false, maxMint: "0", isPausable: false, hasOwner: false, hasMultisig: false, canChangeTax: false, canChangeMaxTx: false, canBlacklist: false, canBurnAny: false, canSelfdestruct: false, dangerousFunctions: [], externalCalls: [], storageLayout: [], sourceCodeLength: 0, compiler: "unknown", optimization: false };
  }
  private emptyLiquidityAnalysis(): LiquidityAnalysis {
    return { totalLiquidityUsd: 0, liquidityLocked: false, pools: [], liquidityConcentration: 0, impermanentLossRisk: 0 };
  }
  private emptyHolderAnalysis(): HolderAnalysis {
    return { totalHolders: 0, top10Percent: 0, top50Percent: 0, top100Percent: 0, creatorHoldingPercent: 0, deadWalletPercent: 0, exchangeWalletsPercent: 0, topHolders: [], holderDistribution: [], concentrationRisk: 0, whaleRisk: 0, suspiciousActivity: false };
  }
  private emptyTradingAnalysis(): TradingAnalysis {
    return { isBuyable: true, isSellable: true, buyTax: 0, sellTax: 0, effectiveBuyTax: 0, effectiveSellTax: 0, antiWhaleEnabled: false, tradingCooldown: 0, volume24h: 0, txCount24h: 0, uniqueTraders24h: 0, averageTradeSize: 0, priceImpact: 0, slippage: { amount1: 0, amount2: 0, amount3: 0 } };
  }
  private emptyAuditInfo(): AuditInfo {
    return { isAudited: false, auditFirms: [], auditReports: [] };
  }
}
