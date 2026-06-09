import { Strategy } from '../types.js';

export const STRATEGY_TEMPLATES: Record<string, () => Strategy> = {
  momentum: () => ({
    name: 'momentum',
    timeframe: '1h',
    riskPerTrade: 2,
    maxPositions: 5,
    rules: [
      {
        id: 'mom-buy',
        priority: 1,
        conditions: [
          { op: 'and', items: [
            { indicator: 'ema12', operator: 'crosses_above', value: 0 },
          ]},
        ],
        action: { type: 'buy', params: { amount: '1000' } },
      },
      {
        id: 'mom-sell',
        priority: 1,
        conditions: [
          { op: 'and', items: [
            { indicator: 'ema12', operator: 'crosses_below', value: 0 },
          ]},
        ],
        action: { type: 'sell', params: { amount: 'all' } },
      },
    ],
  }),

  meanReversion: () => ({
    name: 'mean-reversion',
    timeframe: '1h',
    riskPerTrade: 1.5,
    maxPositions: 3,
    rules: [
      {
        id: 'mr-buy',
        priority: 1,
        conditions: [
          { op: 'and', items: [
            { indicator: 'rsi', operator: '<', value: 30 },
            { indicator: 'close', operator: '<', value: 0 },
          ]},
        ],
        action: { type: 'buy', params: { amount: '500' } },
      },
      {
        id: 'mr-sell',
        priority: 1,
        conditions: [
          { op: 'and', items: [
            { indicator: 'rsi', operator: '>', value: 70 },
          ]},
        ],
        action: { type: 'sell', params: { amount: 'all' } },
      },
    ],
  }),

  breakout: () => ({
    name: 'breakout',
    timeframe: '4h',
    riskPerTrade: 3,
    maxPositions: 2,
    rules: [
      {
        id: 'bo-buy',
        priority: 2,
        conditions: [
          { op: 'and', items: [
            { indicator: 'close', operator: '>', value: 0 },
            { indicator: 'volume', operator: '>', value: 1000000 },
          ]},
        ],
        action: { type: 'buy', params: { amount: '2000' } },
      },
      {
        id: 'bo-sell',
        priority: 1,
        conditions: [
          { op: 'and', items: [
            { indicator: 'close', operator: '<', value: 0 },
          ]},
        ],
        action: { type: 'sell', params: { amount: 'all' } },
      },
    ],
  }),

  scalper: () => ({
    name: 'scalper',
    timeframe: '1m',
    riskPerTrade: 0.5,
    maxPositions: 10,
    rules: [
      {
        id: 'sc-buy',
        priority: 1,
        conditions: [
          { op: 'and', items: [
            { indicator: 'rsi', operator: '<', value: 25 },
          ]},
        ],
        action: { type: 'buy', params: { amount: '100' } },
      },
      {
        id: 'sc-sell',
        priority: 1,
        conditions: [
          { op: 'and', items: [
            { indicator: 'rsi', operator: '>', value: 55 },
          ]},
        ],
        action: { type: 'sell', params: { amount: 'all' } },
      },
    ],
  }),
};

export function getTemplate(name: string): Strategy | undefined {
  const factory = STRATEGY_TEMPLATES[name];
  return factory?.();
}

export function listTemplates(): string[] {
  return Object.keys(STRATEGY_TEMPLATES);
}
