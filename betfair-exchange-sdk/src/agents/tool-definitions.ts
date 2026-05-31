export const BETFAIR_TOOLS = [
  { name: 'betfair_get_events', description: 'Get Betfair events by sport', input_schema: { type: 'object' as const, properties: { eventTypeId: { type: 'string' } }, required: ['eventTypeId'] } },
  { name: 'betfair_get_markets', description: 'Get markets for an event', input_schema: { type: 'object' as const, properties: { eventId: { type: 'string' } }, required: ['eventId'] } },
  { name: 'betfair_get_prices', description: 'Get exchange prices (back/lay) for a market', input_schema: { type: 'object' as const, properties: { marketId: { type: 'string' } }, required: ['marketId'] } },
];
