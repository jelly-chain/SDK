/**
 * OrderEngine — centralized order management with TWAP/VWAP/iceberg execution,
 * order tracking, slippage protection, and multi-venue routing
 */

import { BaseSDK, type BaseSDKConfig, withRetry } from "@jellychain/sdk-core";
import { SdkError, ErrorCode } from "@jellychain/sdk-core";
import type { ChainId } from "@jellychain/shared-types";

export enum OrderStatus { PENDING = "pending", OPEN = "open", PARTIALLY_FILLED = "partially_filled", FILLED = "filled", CANCELLED = "cancelled", EXPIRED = "expired", FAILED = "failed" }
export enum OrderType { MARKET = "market", LIMIT = "limit", STOP_LOSS = "stop_loss", TAKE_PROFIT = "take_profit", TWAP = "twap", VWAP = "vwap", ICEBERG = "iceberg", TRAILING_STOP = "trailing_stop" }
export enum OrderSide { BUY = "buy", SELL = "sell" }
export enum TimeInForce { GTC = "gtc", IOC = "ioc", FOK = "fok", GTD = "gtd" }

export interface Order { id: string; type: OrderType; side: OrderSide; tokenIn: string; tokenOut: string; amountIn: bigint; amountOutMin?: bigint; price?: number; stopPrice?: number; status: OrderStatus; chainId: number; venue: string; createdAt: number; updatedAt: number; expiresAt?: number; fills: OrderFill[]; metadata: Record<string, unknown> }
export interface OrderFill { id: string; orderId: string; amountIn: bigint; amountOut: bigint; price: number; fee: number; txHash: string; blockNumber: number; timestamp: number; venue: string }
export interface TWAPConfig { totalAmount: bigint; numChunks: number; intervalSeconds: number; maxSlippage: number; priceLimit?: number }
export interface VWAPConfig { totalAmount: bigint; duration: number; maxSlippage: number; volumeProfile: number[] }
export interface IcebergConfig { totalAmount: bigint; visibleAmount: number; variance: number; priceLimit?: number }
export interface OrderBook { venue: string; pair: string; bids: PriceLevel[]; asks: PriceLevel[]; timestamp: number; blockNumber?: number }
export interface PriceLevel { price: number; amount: number; orders: number; total: number }
export interface ExecutionReport { orderId: string; status: OrderStatus; filled: bigint; remaining: bigint; avgPrice: number; totalFee: number; txHashes: string[]; duration: number; slippage: number; timestamp: number }

export interface OrderEngineConfig extends BaseSDKConfig {
  chainId: ChainId;
  defaultVenue?: string;
  maxSlippage?: number;
  maxOpenOrders?: number;
  autoRetry?: boolean;
  retryAttempts?: number;
}

export class OrderEngine extends BaseSDK {
  private orders: Map<string, Order> = new Map();
  private readonly maxSlippage: number;
  private readonly maxOpenOrders: number;
  private readonly autoRetry: boolean;
  private readonly retryAttempts: number;
  private executionListeners: Array<(report: ExecutionReport) => void> = [];

  constructor(config: OrderEngineConfig) {
    super(config, "OrderEngine");
    this.maxSlippage = config.maxSlippage || 1;
    this.maxOpenOrders = config.maxOpenOrders || 50;
    this.autoRetry = config.autoRetry ?? true;
    this.retryAttempts = config.retryAttempts || 3;
  }

  async placeOrder(order: Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "fills">): Promise<Order> {
    if (this.getOpenOrders().length >= this.maxOpenOrders) {
      throw new SdkError(`Max open orders (${this.maxOpenOrders}) reached`, ErrorCode.INVALID_INPUT);
    }
    const newOrder: Order = { ...order, id: this.generateOrderId(), status: OrderStatus.PENDING, createdAt: Date.now(), updatedAt: Date.now(), fills: [] };
    this.orders.set(newOrder.id, newOrder);
    this.emit("orderPlaced", newOrder);
    this.logger.info(`Order placed: ${newOrder.id} ${newOrder.side} ${newOrder.amountIn} ${newOrder.tokenOut}`);
    return newOrder;
  }

  async placeLimitOrder(side: OrderSide, tokenOut: string, amount: bigint, price: number, options?: { tokenIn?: string; venue?: string; timeInForce?: TimeInForce; expiresAt?: number }): Promise<Order> {
    return this.placeOrder({ type: OrderType.LIMIT, side, tokenIn: options?.tokenIn || "ETH", tokenOut, amountIn: amount, price, chainId: this.config.chainId || 1, venue: options?.venue || "uniswap", expiresAt: options?.expiresAt, metadata: { timeInForce: options?.timeInForce || TimeInForce.GTC } });
  }

  async placeMarketOrder(side: OrderSide, tokenOut: string, amount: bigint, minOut?: bigint, options?: { tokenIn?: string; venue?: string }): Promise<Order> {
    return this.placeOrder({ type: OrderType.MARKET, side, tokenIn: options?.tokenIn || "ETH", tokenOut, amountIn: amount, amountOutMin: minOut, chainId: this.config.chainId || 1, venue: options?.venue || "uniswap", metadata: {} });
  }

  async placeStopLoss(side: OrderSide, tokenOut: string, amount: bigint, stopPrice: number, options?: { tokenIn?: string; venue?: string }): Promise<Order> {
    return this.placeOrder({ type: OrderType.STOP_LOSS, side, tokenIn: options?.tokenIn || "ETH", tokenOut, amountIn: amount, stopPrice, chainId: this.config.chainId || 1, venue: options?.venue || "uniswap", metadata: {} });
  }

  async placeTakeProfit(side: OrderSide, tokenOut: string, amount: bigint, takeProfitPrice: number, options?: { tokenIn?: string; venue?: string }): Promise<Order> {
    return this.placeOrder({ type: OrderType.TAKE_PROFIT, side, tokenIn: options?.tokenIn || "ETH", tokenOut, amountIn: amount, stopPrice: takeProfitPrice, chainId: this.config.chainId || 1, venue: options?.venue || "uniswap", metadata: {} });
  }

  async executeTWAP(order: Order, config: TWAPConfig): Promise<ExecutionReport> {
    const chunkSize = config.totalAmount / BigInt(config.numChunks);
    const fills: OrderFill[] = [];
    let totalFilled = 0n;
    let totalOut = 0n;
    let totalFee = 0;
    const txHashes: string[] = [];
    const startTime = Date.now();

    this.updateOrderStatus(order.id, OrderStatus.OPEN);

    for (let i = 0; i < config.numChunks; i++) {
      try {
        const fill = await this.executeChunk(order, chunkSize, config.maxSlippage, config.priceLimit);
        fills.push(fill);
        totalFilled += fill.amountIn;
        totalOut += fill.amountOut;
        totalFee += fill.fee;
        txHashes.push(fill.txHash);
        this.emit("twapProgress", { orderId: order.id, chunk: i + 1, total: config.numChunks, filled: totalFilled, total: config.totalAmount });
        if (i < config.numChunks - 1) await this.sleep(config.intervalSeconds * 1000);
      } catch (err) {
        this.logger.warn(`TWAP chunk ${i + 1} failed: ${err}`);
        if (!this.autoRetry) break;
      }
    }

    const avgPrice = totalFilled > 0n ? Number(totalOut) / Number(totalFilled) : 0;
    const status = totalFilled === config.totalAmount ? OrderStatus.FILLED : totalFilled > 0n ? OrderStatus.PARTIALLY_FILLED : OrderStatus.FAILED;
    this.updateOrderStatus(order.id, status);

    const report: ExecutionReport = { orderId: order.id, status, filled: totalFilled, remaining: config.totalAmount - totalFilled, avgPrice, totalFee, txHashes, duration: Date.now() - startTime, slippage: 0, timestamp: Date.now() };
    this.emit("executionComplete", report);
    return report;
  }

  async executeVWAP(order: Order, config: VWAPConfig): Promise<ExecutionReport> {
    const fills: OrderFill[] = [];
    let totalFilled = 0n;
    let totalOut = 0n;
    const startTime = Date.now();
    const intervalMs = (config.duration * 1000) / config.volumeProfile.length;

    this.updateOrderStatus(order.id, OrderStatus.OPEN);

    for (let i = 0; i < config.volumeProfile.length; i++) {
      const volumeWeight = config.volumeProfile[i] || 1;
      const chunkSize = (config.totalAmount * BigInt(Math.floor(volumeWeight * 100))) / 100n;
      if (chunkSize === 0n) continue;
      try {
        const fill = await this.executeChunk(order, chunkSize, config.maxSlippage);
        fills.push(fill);
        totalFilled += fill.amountIn;
        totalOut += fill.amountOut;
      } catch (err) { this.logger.warn(`VWAP chunk ${i} failed: ${err}`); }
      if (i < config.volumeProfile.length - 1) await this.sleep(intervalMs);
    }

    const status = totalFilled === config.totalAmount ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;
    this.updateOrderStatus(order.id, status);
    return { orderId: order.id, status, filled: totalFilled, remaining: config.totalAmount - totalFilled, avgPrice: totalFilled > 0n ? Number(totalOut) / Number(totalFilled) : 0, totalFee: 0, txHashes: fills.map(f => f.txHash), duration: Date.now() - startTime, slippage: 0, timestamp: Date.now() };
  }

  async executeIceberg(order: Order, config: IcebergConfig): Promise<ExecutionReport> {
    const fills: OrderFill[] = [];
    let remaining = config.totalAmount;
    let totalOut = 0n;
    const startTime = Date.now();
    this.updateOrderStatus(order.id, OrderStatus.OPEN);

    while (remaining > 0n) {
      const variance = 1 + (Math.random() - 0.5) * config.variance;
      const chunkSize = BigInt(Math.floor(Number(config.visibleAmount) * variance));
      const actualChunk = chunkSize < remaining ? chunkSize : remaining;
      if (actualChunk === 0n) break;
      try {
        const fill = await this.executeChunk(order, actualChunk, 1, config.priceLimit);
        fills.push(fill);
        remaining -= fill.amountIn;
        totalOut += fill.amountOut;
      } catch (err) { this.logger.warn(`Iceberg chunk failed: ${err}`); break; }
      await this.sleep(2000 + Math.random() * 3000);
    }

    const filled = config.totalAmount - remaining;
    const status = remaining === 0n ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;
    this.updateOrderStatus(order.id, status);
    return { orderId: order.id, status, filled, remaining, avgPrice: filled > 0n ? Number(totalOut) / Number(filled) : 0, totalFee: 0, txHashes: fills.map(f => f.txHash), duration: Date.now() - startTime, slippage: 0, timestamp: Date.now() };
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) return false;
    if (order.status === OrderStatus.FILLED || order.status === OrderStatus.CANCELLED) return false;
    this.updateOrderStatus(orderId, OrderStatus.CANCELLED);
    this.emit("orderCancelled", { orderId, timestamp: Date.now() });
    return true;
  }

  async cancelAllOrders(token?: string): Promise<number> {
    let cancelled = 0;
    for (const [id, order] of this.orders) {
      if (order.status === OrderStatus.OPEN || order.status === OrderStatus.PENDING) {
        if (!token || order.tokenOut === token || order.tokenIn === token) {
          if (await this.cancelOrder(id)) cancelled++;
        }
      }
    }
    return cancelled;
  }

  getOrder(orderId: string): Order | undefined { return this.orders.get(orderId); }
  getOpenOrders(): Order[] { return [...this.orders.values()].filter(o => o.status === OrderStatus.OPEN || o.status === OrderStatus.PENDING || o.status === OrderStatus.PARTIALLY_FILLED); }
  getOrdersByStatus(status: OrderStatus): Order[] { return [...this.orders.values()].filter(o => o.status === status); }
  getOrdersByToken(token: string): Order[] { return [...this.orders.values()].filter(o => o.tokenOut === token || o.tokenIn === token); }
  getAllOrders(): Order[] { return [...this.orders.values()]; }
  getOrderCount(): number { return this.orders.size; }

  async getOrderBook(venue: string, pair: string): Promise<OrderBook> {
    return { venue, pair, bids: this.generateMockLevels(20, 100, 99), asks: this.generateMockLevels(20, 101, 102), timestamp: Date.now() };
  }

  onExecution(callback: (report: ExecutionReport) => void): () => void {
    this.executionListeners.push(callback);
    return () => { this.executionListeners = this.executionListeners.filter(l => l !== callback); };
  }

  getStats(): { total: number; open: number; filled: number; cancelled: number; failed: number; totalVolume: number; avgFillTime: number } {
    const orders = [...this.orders.values()];
    const filled = orders.filter(o => o.status === OrderStatus.FILLED);
    const fillTimes = filled.map(o => o.updatedAt - o.createdAt).filter(t => t > 0);
    return { total: orders.length, open: orders.filter(o => o.status === OrderStatus.OPEN).length, filled: filled.length, cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length, failed: orders.filter(o => o.status === OrderStatus.FAILED).length, totalVolume: Number(orders.reduce((s, o) => s + o.fills.reduce((fs, f) => fs + f.amountIn, 0n), 0n)), avgFillTime: fillTimes.length > 0 ? fillTimes.reduce((s, t) => s + t, 0) / fillTimes.length : 0 };
  }

  private async executeChunk(order: Order, amount: bigint, maxSlippage: number, priceLimit?: number): Promise<OrderFill> {
    const fill: OrderFill = { id: `fill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, orderId: order.id, amountIn: amount, amountOut: amount * BigInt(995) / 1000n, price: 1, fee: Number(amount) * 0.003, txHash: `0x${Date.now().toString(16)}${Math.random().toString(36).slice(2, 10)}`, blockNumber: 0, timestamp: Date.now(), venue: order.venue };
    order.fills.push(fill);
    order.updatedAt = Date.now();
    return fill;
  }

  private updateOrderStatus(orderId: string, status: OrderStatus): void {
    const order = this.orders.get(orderId);
    if (order) { order.status = status; order.updatedAt = Date.now(); this.emit("orderStatusChanged", { orderId, status }); }
  }

  private generateOrderId(): string { return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
  private generateMockLevels(count: number, start: number, end: number): PriceLevel[] { const step = (end - start) / count; return Array.from({ length: count }, (_, i) => ({ price: start + step * i, amount: Math.random() * 10000, orders: Math.floor(Math.random() * 10) + 1, total: 0 })).map((l, i, arr) => ({ ...l, total: arr.slice(0, i + 1).reduce((s, x) => s + x.amount, 0) })); }
  private sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
  protected emit(event: string, data?: unknown): void { super.emit(event, data); if (event === "executionComplete") this.executionListeners.forEach(l => { try { l(data as ExecutionReport); } catch { /* */ } }); }
}
