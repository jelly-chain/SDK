export const METACULUS_TOOLS = [
  { name: 'metaculus_search', description: 'Search Metaculus questions by topic', input_schema: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'metaculus_get_prediction', description: 'Get community prediction for a question', input_schema: { type: 'object' as const, properties: { questionId: { type: 'number' } }, required: ['questionId'] } },
  { name: 'metaculus_get_trending', description: 'Get trending questions on Metaculus', input_schema: { type: 'object' as const, properties: {}, required: [] } },
];
