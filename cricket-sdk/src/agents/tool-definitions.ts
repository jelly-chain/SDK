export const CRICKET_TOOLS = [
  { name: 'cricket_get_live', description: 'Get live cricket matches', input_schema: { type: 'object' as const, properties: {}, required: [] } },
  { name: 'cricket_get_upcoming', description: 'Get upcoming matches', input_schema: { type: 'object' as const, properties: {}, required: [] } },
  { name: 'cricket_predict', description: 'Predict match outcome', input_schema: { type: 'object' as const, properties: { homeTeam: { type: 'string' }, awayTeam: { type: 'string' }, format: { type: 'string' }, venue: { type: 'string' } }, required: ['homeTeam', 'awayTeam'] } },
];
