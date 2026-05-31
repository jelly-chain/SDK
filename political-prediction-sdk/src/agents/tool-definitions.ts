export const POLITICAL_TOOLS = [
  { name: 'political_get_presidential', description: 'Get presidential election markets', input_schema: { type: 'object' as const, properties: {}, required: [] } },
  { name: 'political_search', description: 'Search political markets by topic', input_schema: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'political_compare_polls', description: 'Compare market prices to polling averages', input_schema: { type: 'object' as const, properties: { marketId: { type: 'string' }, pollingAvg: { type: 'number' } }, required: ['marketId', 'pollingAvg'] } },
];
