export const KALSHI_TOOLS = [
  { name: 'kalshi_get_events', description: 'Get Kalshi events by category', input_schema: { type: 'object' as const, properties: { category: { type: 'string' }, status: { type: 'string' } }, required: [] } },
  { name: 'kalshi_get_markets', description: 'Get Kalshi markets with orderbook data', input_schema: { type: 'object' as const, properties: { eventTicker: { type: 'string' }, category: { type: 'string' } }, required: [] } },
  { name: 'kalshi_get_orderbook', description: 'Get orderbook for a market', input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' } }, required: ['ticker'] } },
  { name: 'kalshi_place_order', description: 'Place an order on Kalshi', input_schema: { type: 'object' as const, properties: { ticker: { type: 'string' }, side: { type: 'string' }, action: { type: 'string' }, quantity: { type: 'number' }, price: { type: 'number' } }, required: ['ticker', 'side', 'action', 'quantity'] } },
];
