import { RiskConfig, Order, Position } from '../types.js';

export class RiskManager {
  config: RiskConfig;
  private dailyPnl = 0;
  private totalExposure: Map<string, bigint> = new Map();

  constructor(config: RiskConfig) {
    this.config = config;
  }

  /**
   * Validate an order against risk limits.
   */
  validateOrder(order: Order): { valid: boolean; reason?: string } {
    // Max open orders
    // Note: in production we'd check this.orderBook

    // Max position size
    const orderValue = BigInt(order.amount) * BigInt(order.price || '1');
    if (orderValue > BigInt(this.config.maxPositionSizeUsd)) {
      return { valid: false, reason: 'Exceeds max position size' };
    }

    return { valid: true };
  }

  /**
   * Check if a position exceeds exposure limits.
   */
  checkExposure(chain: string, additionalUsd: bigint): boolean {
    const current = this.totalExposure.get(chain) || 0n;
    const limit = BigInt(this.config.maxExposurePerChain[chain] || '1000000000');
    return current + additionalUsd <= limit;
  }

  /**
   * Check if daily loss limit is hit.
   */
  checkDailyLimit(): boolean {
    return BigInt(this.dailyPnl) > -BigInt(this.config.dailyLossLimitUsd);
  }

  /**
   * Update P&L tracking.
   */
  recordPnl(pnlUsd: bigint): void {
    this.dailyPnl += Number(pnlUsd);
  }

  /**
   * Calculate liquidation price for a leveraged position.
   */
  calculateLiquidationPrice(entryPrice: string, leverage: number, side: 'long' | 'short'): string {
    const entry = Number(entryPrice);
    const maintenanceMargin = 0.05; // 5%
    if (side === 'long') {
      return (entry * (1 - 1 / leverage + maintenanceMargin)).toFixed(18);
    }
    return (entry * (1 + 1 / leverage - maintenanceMargin)).toFixed(18);
  }

  /**
   * Calculate position size based on risk parameters.
   */
  calculatePositionSize(
    accountSizeUsd: string,
    riskPercent: number,
    entryPrice: string,
    stopLossPrice: string
  ): string {
    const riskAmount = BigInt(accountSizeUsd) * BigInt(Math.round(riskPercent * 100)) / 10000n;
    const riskPerUnit = Math.abs(Number(entryPrice) - Number(stopLossPrice));
    if (riskPerUnit === 0) return '0';
    return (Number(riskAmount) / riskPerUnit).toFixed(18);
  }

  resetDaily(): void {
    this.dailyPnl = 0;
  }
}
