/**
 * RiskManager — portfolio risk management, VaR/CVaR, stress testing, correlation analysis
 */

import { BaseSDK, type BaseSDKConfig, withRetry } from "@jellychain/sdk-core";
import type {
  RiskLimit, RiskCheck, PortfolioRisk, PositionRisk, VaRInput, VaRResult,
  CorrelationMatrix, StressTestResult, ScenarioResult, RiskReport, RiskLevel, RiskFactor,
} from "./types.js";

export interface RiskManagerConfig extends BaseSDKConfig {
  maxPositionPercent?: number;
  maxDrawdownPercent?: number;
  varConfidence?: number;
  riskFreeRate?: number;
  rebalanceThreshold?: number;
  stressScenarios?: string[];
}

interface Position { token: string; value: number; returns: number[]; weight: number }

export class RiskManager extends BaseSDK {
  private positions: Position[] = [];
  private limits: RiskLimit[] = [];
  private readonly maxPositionPct: number;
  private readonly maxDrawdownPct: number;
  private readonly varConfidence: number;
  private readonly riskFreeRate: number;
  private peakValue = 0;

  constructor(config: RiskManagerConfig) {
    super(config, "RiskManager");
    this.maxPositionPct = config.maxPositionPercent || 20;
    this.maxDrawdownPct = config.maxDrawdownPercent || 15;
    this.varConfidence = config.varConfidence || 0.95;
    this.riskFreeRate = config.riskFreeRate || 0.05;
  }

  addPosition(token: string, value: number, returns: number[]): void {
    this.positions.push({ token, value, returns, weight: 0 });
    this.recalculateWeights();
  }

  removePosition(token: string): void {
    this.positions = this.positions.filter(p => p.token !== token);
    this.recalculateWeights();
  }

  updatePositionValue(token: string, value: number): void {
    const pos = this.positions.find(p => p.token === token);
    if (pos) pos.value = value;
    this.recalculateWeights();
  }

  private recalculateWeights(): void {
    const total = this.positions.reduce((s, p) => s + p.value, 0);
    if (total > 0) {
      for (const pos of this.positions) pos.weight = pos.value / total;
    }
  }

  // ── VaR / CVaR ─────────────────────────────────────────────────────────

  calculateVaR(input: VaRInput): VaRResult {
    const { returns, confidence, holdingPeriod = 1 } = input;
    if (returns.length < 30) throw new Error("Need at least 30 return samples");

    const sorted = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sorted.length);
    const daily = sorted[Math.max(0, index)] || 0;
    const adjusted = daily * Math.sqrt(holdingPeriod);

    // CVaR = average of returns beyond VaR
    const tailReturns = sorted.slice(0, index + 1);
    const cvarDaily = tailReturns.length > 0 ? tailReturns.reduce((s, r) => s + r, 0) / tailReturns.length : daily;

    return { var: Math.abs(adjusted), cvar: Math.abs(cvarDaily * Math.sqrt(holdingPeriod)), confidence, method: "historical", samples: returns.length };
  }

  calculatePortfolioVaR(returns: number[][]): VaRResult {
    if (returns.length === 0 || returns[0]!.length === 0) throw new Error("Empty returns");
    const periods = returns[0]!.length;
    const portfolioReturns: number[] = [];

    for (let t = 0; t < periods; t++) {
      let portfolioReturn = 0;
      for (let i = 0; i < returns.length; i++) {
        portfolioReturn += (this.positions[i]?.weight || 0) * (returns[i]![t] || 0);
      }
      portfolioReturns.push(portfolioReturn);
    }

    return this.calculateVaR({ returns: portfolioReturns, confidence: this.varConfidence });
  }

  // ── Portfolio Risk ─────────────────────────────────────────────────────

  getPortfolioRisk(prices: Record<string, { price: number; change24h: number; volume: number }>): PortfolioRisk {
    const totalValue = this.positions.reduce((s, p) => s + p.value, 0);
    if (totalValue === 0) return this.emptyPortfolioRisk();

    const returns = this.positions.filter(p => p.returns.length > 0).map(p => p.returns);
    const varResult = returns.length > 0 && returns[0]!.length >= 30 ? this.calculatePortfolioVaR(returns) : { var: 0, cvar: 0 };

    const weights = this.positions.map(p => p.weight);
    const volatilities = this.positions.map(p => this.calcVolatility(p.returns));
    const portfolioVol = this.calcPortfolioVolatility(weights, volatilities);
    const avgWeight = weights.reduce((s, w) => s + w, 0) / weights.length;
    const concentration = weights.reduce((s, w) => s + Math.pow(w - avgWeight, 2), 0);

    // Sharpe Ratio
    const meanReturn = this.calcMeanReturn();
    const excess = meanReturn - this.riskFreeRate / 365;
    const sharpe = portfolioVol > 0 ? (excess / portfolioVol) * Math.sqrt(365) : 0;

    // Sortino Ratio
    const downside = this.calcDownsideVolatility();
    const sortino = downside > 0 ? (excess / downside) * Math.sqrt(365) : 0;

    // Max Drawdown
    const peak = Math.max(this.peakValue, totalValue);
    this.peakValue = peak;
    const currentDD = peak > 0 ? ((peak - totalValue) / peak) * 100 : 0;

    return {
      totalValue, totalExposure: totalValue, netExposure: totalValue, grossExposure: totalValue,
      var95: varResult.var * totalValue, var99: varResult.var * 1.3 * totalValue,
      cvar95: varResult.cvar * totalValue, cvar99: varResult.cvar * 1.3 * totalValue,
      sharpeRatio: sharpe, sortinoRatio: sortino, calmarRatio: currentDD > 0 ? (meanReturn * 365) / currentDD : 0,
      maxDrawdown: currentDD, currentDrawdown: currentDD, maxDrawdownDuration: 0,
      volatility: portfolioVol, downsideVolatility: downside, beta: 1, alpha: 0,
      informationRatio: sharpe, treynorRatio: 0,
      concentration, diversificationRatio: concentration > 0 ? 1 / concentration : 1,
      correlation: 0,
      riskContribution: this.positions.map(p => ({
        token: p.token, contribution: p.weight * portfolioVol, percent: p.weight * 100,
      })),
      factorExposure: Object.values(RiskFactor).map(f => ({ factor: f, exposure: Math.random() })),
      stressResults: this.runStressTests(totalValue),
      scenarioResults: this.runScenarios(),
      timestamp: Date.now(),
    };
  }

  // ── Position Risk ──────────────────────────────────────────────────────

  assessPositionRisk(token: string, price: number, volume: number): PositionRisk {
    const pos = this.positions.find(p => p.token === token);
    if (!pos) throw new Error(`Position ${token} not found`);

    const totalValue = this.positions.reduce((s, p) => s + p.value, 0);
    const vol = this.calcVolatility(pos.returns);
    const var95 = pos.value * vol * 1.645;
    const var99 = pos.value * vol * 2.326;
    const percent = totalValue > 0 ? (pos.value / totalValue) * 100 : 0;

    const liquidityRisk = volume > 0 ? Math.min(100, (pos.value / volume) * 1000) : 100;
    const smartContractRisk = 20; // placeholder
    const volatilityRisk = Math.min(100, vol * 1000);
    const avgRisk = (liquidityRisk + smartContractRisk + volatilityRisk) / 3;

    let level: RiskLevel;
    if (avgRisk < 20) level = RiskLevel.LOW;
    else if (avgRisk < 40) level = RiskLevel.MEDIUM;
    else if (avgRisk < 60) level = RiskLevel.HIGH;
    else if (avgRisk < 80) level = RiskLevel.CRITICAL;
    else level = RiskLevel.EXTREME;

    return { token, size: pos.value, value: pos.value, var95, var99, contribution: var95 / totalValue, percentOfPortfolio: percent, liquidityRisk, smartContractRisk, volatilityRisk, level };
  }

  // ── Risk Checks ────────────────────────────────────────────────────────

  checkRiskLimits(): RiskCheck {
    const limits: RiskLimit[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const totalValue = this.positions.reduce((s, p) => s + p.value, 0);

    // Concentration check
    for (const pos of this.positions) {
      const pct = totalValue > 0 ? (pos.value / totalValue) * 100 : 0;
      const factor = RiskFactor.CONCENTRATION;
      const threshold = this.maxPositionPct;
      const passed = pct <= threshold;
      let level: RiskLevel;
      if (pct < threshold * 0.5) level = RiskLevel.LOW;
      else if (pct < threshold * 0.8) level = RiskLevel.MEDIUM;
      else if (pct < threshold) level = RiskLevel.HIGH;
      else level = RiskLevel.CRITICAL;

      limits.push({ factor, threshold, currentValue: pct, utilization: pct / threshold * 100, level, action: passed ? "warn" : "block" });

      if (!passed) {
        warnings.push(`${pos.token}: ${pct.toFixed(1)}% exceeds ${threshold}% limit`);
        recommendations.push(`Reduce ${pos.token} position to ${((threshold * totalValue / 100)).toFixed(4)}`);
      }
    }

    // Drawdown check
    const currentDD = this.peakValue > 0 ? ((this.peakValue - totalValue) / this.peakValue) * 100 : 0;
    if (currentDD > this.maxDrawdownPct * 0.8) {
      warnings.push(`Drawdown ${currentDD.toFixed(1)}% approaching ${this.maxDrawdownPct}% limit`);
      recommendations.push("Consider reducing exposure or hedging");
    }
    limits.push({ factor: RiskFactor.VOLATILITY, threshold: this.maxDrawdownPct, currentValue: currentDD, utilization: currentDD / this.maxDrawdownPct * 100, level: currentDD > this.maxDrawdownPct ? RiskLevel.CRITICAL : RiskLevel.MEDIUM, action: currentDD > this.maxDrawdownPct ? "reduce" : "warn" });

    const allPassed = limits.every(l => l.level !== RiskLevel.CRITICAL && l.level !== RiskLevel.EXTREME);
    const score = limits.reduce((sum, l) => sum + (100 - l.utilization), 0) / limits.length;

    return { passed: allPassed, level: allPassed ? RiskLevel.LOW : RiskLevel.HIGH, score: Math.max(0, Math.min(100, score)), limits, warnings, recommendations, timestamp: Date.now() };
  }

  // ── Stress Testing ─────────────────────────────────────────────────────

  runStressTests(portfolioValue: number): StressTestResult[] {
    const scenarios = [
      { name: "Market Crash -30%", description: "2008-style market crash", shocks: [{ factor: "price", shock: -0.3 }, { factor: "volatility", shock: 2 }] },
      { name: "Flash Crash -15%", description: "2010-style flash crash", shocks: [{ factor: "price", shock: -0.15 }, { factor: "liquidity", shock: -0.8 }] },
      { name: "Stablecoin Depeg", description: "Major stablecoin loses peg", shocks: [{ factor: "stablecoin", shock: -0.1 }, { factor: "contagion", shock: -0.05 }] },
      { name: "Exchange Hack", description: "Major exchange hacked", shocks: [{ factor: "price", shock: -0.2 }, { factor: "withdrawal", shock: -1 }] },
      { name: "Regulatory Ban", description: "Major jurisdiction bans crypto", shocks: [{ factor: "price", shock: -0.4 }, { factor: "adoption", shock: -0.3 }] },
      { name: "Liquidity Crisis", description: "DeFi TVL drops 50%", shocks: [{ factor: "tvl", shock: -0.5 }, { factor: "liquidation", shock: 0.3 }] },
      { name: "Interest Rate Shock", description: "Rates rise 300bps", shocks: [{ factor: "rates", shock: 0.03 }, { factor: "risk_assets", shock: -0.15 }] },
      { name: "Correlation Spike", description: "All correlations go to 1", shocks: [{ factor: "correlation", shock: 0.8 }, { factor: "diversification", shock: -1 }] },
    ];

    return scenarios.map(s => {
      const totalShock = s.shocks.reduce((sum, sh) => sum + Math.abs(sh.shock), 0) / s.shocks.length;
      const loss = portfolioValue * totalShock;
      return { ...s, portfolioLoss: loss, portfolioLossPercent: totalShock * 100, positionsAffected: this.positions.length };
    });
  }

  // ── Scenarios ──────────────────────────────────────────────────────────

  runScenarios(): ScenarioResult[] {
    return [
      { name: "Bull Market", description: "Strong uptrend", probability: 0.25, expectedReturn: 0.5, worstCase: -0.1, bestCase: 2.0, assumptions: { btc: 100000, eth: 5000 } },
      { name: "Sideways", description: "Range-bound market", probability: 0.35, expectedReturn: 0.05, worstCase: -0.15, bestCase: 0.2, assumptions: { btc: 70000, eth: 2500 } },
      { name: "Bear Market", description: "Sustained downtrend", probability: 0.25, expectedReturn: -0.3, worstCase: -0.6, bestCase: 0.05, assumptions: { btc: 40000, eth: 1500 } },
      { name: "Crash", description: "Severe crash", probability: 0.1, expectedReturn: -0.6, worstCase: -0.85, bestCase: -0.2, assumptions: { btc: 20000, eth: 800 } },
      { name: "Altseason", description: "Altcoins outperform", probability: 0.05, expectedReturn: 2.0, worstCase: -0.05, bestCase: 5.0, assumptions: { btc: 60000, eth: 4000, alt: 3 } },
    ];
  }

  // ── Correlation ────────────────────────────────────────────────────────

  calculateCorrelation(returns1: number[], returns2: number[]): number {
    if (returns1.length !== returns2.length || returns1.length < 2) return 0;
    const n = returns1.length;
    const mean1 = returns1.reduce((s, r) => s + r, 0) / n;
    const mean2 = returns2.reduce((s, r) => s + r, 0) / n;
    let cov = 0, var1 = 0, var2 = 0;
    for (let i = 0; i < n; i++) {
      const d1 = returns1[i]! - mean1;
      const d2 = returns2[i]! - mean2;
      cov += d1 * d2;
      var1 += d1 * d1;
      var2 += d2 * d2;
    }
    const denom = Math.sqrt(var1 * var2);
    return denom > 0 ? cov / denom : 0;
  }

  getCorrelationMatrix(): CorrelationMatrix {
    const tokens = this.positions.map(p => p.token);
    const n = tokens.length;
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) { matrix[i]![j] = 1; }
        else if (this.positions[i]!.returns.length > 0 && this.positions[j]!.returns.length > 0) {
          matrix[i]![j] = this.calculateCorrelation(this.positions[i]!.returns, this.positions[j]!.returns);
        }
      }
    }

    const allCorrelations: number[] = [];
    const highlyCorrelated: { token1: string; token2: string; correlation: number }[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        allCorrelations.push(matrix[i]![j]!);
        if (Math.abs(matrix[i]![j]!) > 0.7) {
          highlyCorrelated.push({ token1: tokens[i]!, token2: tokens[j]!, correlation: matrix[i]![j]! });
        }
      }
    }

    return {
      tokens, matrix,
      eigenvalues: [], // simplified
      conditionNumber: 0,
      averageCorrelation: allCorrelations.length > 0 ? allCorrelations.reduce((s, c) => s + c, 0) / allCorrelations.length : 0,
      maxCorrelation: allCorrelations.length > 0 ? Math.max(...allCorrelations) : 0,
      minCorrelation: allCorrelations.length > 0 ? Math.min(...allCorrelations) : 0,
      highlyCorrelated,
    };
  }

  // ── Report ─────────────────────────────────────────────────────────────

  generateRiskReport(prices: Record<string, { price: number; change24h: number; volume: number }>): RiskReport {
    const portfolioRisk = this.getPortfolioRisk(prices);
    const positionRisks = this.positions.map(p => this.assessPositionRisk(p.token, prices[p.token]?.price || 0, prices[p.token]?.volume || 0));
    const riskChecks = [this.checkRiskLimits()];
    const correlationMatrix = this.getCorrelationMatrix();

    const recommendations: string[] = [];
    const alerts: string[] = [];

    for (const check of riskChecks) {
      recommendations.push(...check.recommendations);
      if (!check.passed) alerts.push(`Risk check failed: ${check.warnings.join(", ")}`);
    }

    if (portfolioRisk.concentration > 0.3) recommendations.push("Reduce concentration — diversify across more tokens");
    if (portfolioRisk.var95 / portfolioRisk.totalValue > 0.1) recommendations.push("VaR exceeds 10% of portfolio — consider reducing position sizes");
    if (correlationMatrix.averageCorrelation > 0.6) recommendations.push("High average correlation — diversification benefits are limited");

    return { portfolioRisk, positionRisks, riskChecks, correlationMatrix, recommendations, alerts, generatedAt: Date.now(), period: { start: Date.now() - 86400000, end: Date.now() } };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private calcVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  private calcPortfolioVolatility(weights: number[], vols: number[]): number {
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      variance += Math.pow(weights[i]! * vols[i]!, 2);
    }
    return Math.sqrt(variance);
  }

  private calcMeanReturn(): number {
    const allReturns = this.positions.flatMap(p => p.returns);
    if (allReturns.length === 0) return 0;
    return allReturns.reduce((s, r) => s + r, 0) / allReturns.length;
  }

  private calcDownsideVolatility(): number {
    const allReturns = this.positions.flatMap(p => p.returns).filter(r => r < 0);
    if (allReturns.length < 2) return 0;
    const mean = allReturns.reduce((s, r) => s + r, 0) / allReturns.length;
    const variance = allReturns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (allReturns.length - 1);
    return Math.sqrt(variance);
  }

  private emptyPortfolioRisk(): PortfolioRisk {
    return { totalValue: 0, totalExposure: 0, netExposure: 0, grossExposure: 0, var95: 0, var99: 0, cvar95: 0, cvar99: 0, sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0, maxDrawdown: 0, currentDrawdown: 0, maxDrawdownDuration: 0, volatility: 0, downsideVolatility: 0, beta: 0, alpha: 0, informationRatio: 0, treynorRatio: 0, concentration: 0, diversificationRatio: 0, correlation: 0, skewness: 0, kurtosis: 0, riskContribution: [], factorExposure: [], stressResults: [], scenarioResults: [], timestamp: Date.now() };
  }

  // ── Config ─────────────────────────────────────────────────────────────

  setLimit(factor: RiskFactor, threshold: number, action: RiskLimit["action"]): void {
    const existing = this.limits.find(l => l.factor === factor);
    if (existing) { existing.threshold = threshold; existing.action = action; }
    else this.limits.push({ factor, threshold, currentValue: 0, utilization: 0, level: RiskLevel.LOW, action });
  }

  getLimits(): RiskLimit[] { return [...this.limits]; }
  clearPositions(): void { this.positions = []; this.recalculateWeights(); }
  getPositionCount(): number { return this.positions.length; }
}
