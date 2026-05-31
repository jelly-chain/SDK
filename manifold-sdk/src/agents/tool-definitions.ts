export const MANIFOLD_TOOLS = [
  { name: 'manifold_search', description: 'Search Manifold Markets by topic', input_schema: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'manifold_get_market', description: 'Get market details and probability', input_schema: { type: 'object' as const, properties: { marketId: { type: 'string' } }, required: ['marketId'] } },
  { name: 'manifold_get_calibration', description: 'Get calibration data for model evaluation', input_schema: { type: 'object' as const, properties: {}, required: [] } },
];
