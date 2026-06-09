import { Order, OrderStatus, OrderSide, Position } from '../types.js';
import { OrderBook } from '../orders/limit.js';
import { RiskManager } from '../risk.js';

export class OrderEngine {
  private orderBook: OrderBook;
  private positions: Map<string, Position> = new Map();
  private riskManager: RiskManager;
  private orderCounter = 0;

  constructor(riskConfig: any) {
    this.orderBook = new OrderBook();
    this.riskManager = new RiskManager(riskConfig);
  }

  /**
   * Place a new order.
   */
  async placeOrder(params: Omit<Order, 'id' | 'status' | 'filled' | 'updatedAt'>): Promise<Order> {
    const id = `order-${++this.orderCounter}-${Date.now()}`;
    const order: Order = {
      ...params,
      id,
      status: 'open',
      filled: '0',
      updatedAt: createdAt,
      createdAt: params.createdAt || Date.now(),
    };

    // Risk check
    const riskCheck = await this.riskManager.validateOrder(order);
    if (!riskCheck.valid) {
      order.status = 'cancelled';
      throw new Error(`Risk check failed: ${riskCheck.reason}`);
    }

    this.orderBook.add(order);
    return order;
  }

  /**
   * Match an order against a market price.
   */
  match(orderId: string, marketPrice: string): Order | null {
    const order = this.orderBook.get(orderId);
    if (!order || order.status !== 'open') return null;

    let shouldFill = false;

    switch (order.type) {
      case 'market':
        shouldFill = true;
        break;
      case 'limit':
        shouldFill = order.side === 'buy'
          ? BigInt(marketPrice) <= BigInt(order.price || '0')
          : BigInt(marketPrice) >= BigInt(order.price || '0');
        break;
      case 'stop-loss':
        shouldFill = order.side === 'sell'
          ? BigInt(marketPrice) <= BigInt(order.stopPrice || '0')
          : BigInt(marketPrice) >= BigInt(order.stopPrice || '0');
        break;
    }

    if (!shouldFill) return null;

    // Fill the order
    const remaining = BigInt(order.amount) - BigInt(order.filled);
    const fillAmount = remaining.toString();

    const updated = this.orderBook.update(orderId, {
      filled: order.amount,
      status: 'filled',
    });

    if (updated) {
      this.updatePosition(updated, marketPrice);
    }

    return updated || null;
  }

  /**
   * Cancel an order.
   */
  cancel(orderId: string): boolean {
    return this.orderBook.cancel(orderId);
  }

  /**
   * Get order by ID.
   */
  getOrder(orderId: string): Order | undefined {
    return this.orderBook.get(orderId);
  }

  /**
   * Get all open orders.
   */
  getOpenOrders(): Order[] {
    return this.orderBook.getOpen();
  }

  /**
   * Get position for a token.
   */
  getPosition(token: string): Position | undefined {
    return this.positions.get(token);
  }

  /**
   * Get all positions.
   */
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  private updatePosition(order: Order, fillPrice: string): void {
    const key = `${order.chain}:${order.token}`;
    const existing = this.positions.get(key);

    const fillAmount = BigInt(order.filled);
    const price = BigInt(fillPrice);
    const value = fillAmount * price;

    if (!existing) {
      this.positions.set(key, {
        token: order.token,
        symbol: order.symbol,
        chain: order.chain,
        side: order.side === 'buy' ? 'long' : 'short',
        entryPrice: fillPrice,
        amount: order.filled,
        unrealizedPnl: '0',
        realizedPnl: '0',
        leverage: 1,
      });
    } else {
      // Update average entry price and PnL
      const totalAmount = BigInt(existing.amount) + fillAmount;
      const avgEntry = (BigInt(existing.entryPrice) * BigInt(existing.amount) + value) / totalAmount;
      const unrealizedPnl = order.side === 'buy'
        ? (price - avgEntry) * totalAmount
        : (avgEntry - price) * totalAmount;

      this.positions.set(key, {
        ...existing,
        amount: totalAmount.toString(),
        entryPrice: avgEntry.toString(),
        unrealizedPnl: unrealizedPnl.toString(),
      });
    }
  }
}


