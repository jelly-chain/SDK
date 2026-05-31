export const POLYMARKET_TOOLS = [
  { name: 'polymarket_search_markets', description: 'Search Polymarket markets by keyword', input_schema: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'polymarket_get_orderbook', description: 'Get orderbook depth for a market', input_schema: { type: 'object' as const, properties: { tokenId: { type: 'string' } }, required: ['tokenId'] } },
  { name: 'polymarket_get_trades', description: 'Get recent trades for a market', input_schema: { type: 'object' as const, properties: { tokenId: { type: 'string' }, limit: { type: 'number' } }, required: ['tokenId'] } },
  { name: 'polymarket_detect_arbitrage', description: 'Detect arbitrage between Polymarket and external platform', input_schema: { type: 'object' as const, properties: { market: { type: 'string' }, externalPrice: { type: 'number' }, platform: { type: 'string' } }, required: ['market', 'externalPrice', 'platform'] } },
];
