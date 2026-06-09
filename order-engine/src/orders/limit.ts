import { Order, OrderStatus } from '../types.js';

export class OrderBook {
  private orders: Map<string, Order> = new Map();
  private readonly byToken: Map<string, Set<string>> = new Map();

  add(order: Order): void {
    this.orders.set(order.id, order);
    const tokenOrders = this.byToken.get(order.token) || new Set();
    tokenOrders.add(order.id);
    this.byToken.set(order.token, tokenOrders);
  }

  get(id: string): Order | undefined {
    return this.orders.get(id);
  }

  update(id: string, updates: Partial<Order>): Order | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, ...updates, updatedAt: Date.now() };
    this.orders.set(id, updated);
    return updated;
  }

  cancel(id: string): boolean {
    const order = this.orders.get(id);
    if (!order) return false;
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    this.orders.set(id, order);
    return true;
  }

  getByToken(token: string): Order[] {
    const ids = this.byToken.get(token);
    if (!ids) return [];
    return Array.from(ids).map(id => this.orders.get(id)!).filter(Boolean);
  }

  getOpen(): Order[] {
    return Array.from(this.orders.values()).filter(o =>
      ['pending', 'open', 'partial'].includes(o.status)
    );
  }

  getActiveByStatus(status: OrderStatus): Order[] {
    return Array.from(this.orders.values()).filter(o => o.status === status);
  }

  remove(id: string): void {
    const order = this.orders.get(id);
    if (order) {
      this.byToken.get(order.token)?.delete(id);
      this.orders.delete(id);
    }
  }

  get size(): number {
    return this.orders.size;
  }
}
