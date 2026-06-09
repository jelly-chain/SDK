import { Action, ActionType } from '../types.js';

export class ActionEngine {
  /**
   * Execute an action with the given context.
   */
  execute(action: Action, context: Record<string, unknown>): Record<string, unknown> {
    switch (action.type) {
      case 'buy':
        return this.executeBuy(action.params, context);
      case 'sell':
        return this.executeSell(action.params, context);
      case 'swap':
        return this.executeSwap(action.params, context);
      case 'rebalance':
        return this.executeRebalance(action.params, context);
      case 'hold':
        return { action: 'hold', reason: 'No signal' };
      case 'alert':
        return { action: 'alert', message: action.params.message };
      default:
        return { action: 'unknown', error: `Unknown action type: ${action.type}` };
    }
  }

  private executeBuy(params: Record<string, unknown>, ctx: Record<string, unknown>): Record<string, unknown> {
    const amount = params.amount || '0';
    return { action: 'buy', amount, token: ctx.token, price: ctx.price, status: 'executed' };
  }

  private executeSell(params: Record<string, unknown>, ctx: Record<string, unknown>): Record<string, unknown> {
    const amount = params.amount || 'all';
    return { action: 'sell', amount, token: ctx.token, price: ctx.price, status: 'executed' };
  }

  private executeSwap(params: Record<string, unknown>, ctx: Record<string, unknown>): Record<string, unknown> {
    return { action: 'swap', from: params.from, to: params.to, amount: params.amount, status: 'executed' };
  }

  private executeRebalance(params: Record<string, unknown>, _ctx: Record<string, unknown>): Record<string, unknown> {
    return { action: 'rebalance', allocations: params.allocations, status: 'executed' };
  }

  /**
   * Validate that an action has required parameters.
   */
  validate(action: Action): { valid: boolean; missing?: string[] } {
    const missing: string[] = [];
    if (action.type === 'swap' && !action.params.from) missing.push('from');
    if (action.type === 'swap' && !action.params.to) missing.push('to');
    return { valid: missing.length === 0, missing };
  }
}
