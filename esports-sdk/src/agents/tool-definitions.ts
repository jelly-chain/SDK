export const ESPORTS_TOOLS = [
  { name: 'esports_get_live_matches', description: 'Get live esports matches', input_schema: { type: 'object' as const, properties: { title: { type: 'string' } }, required: [] } },
  { name: 'esports_get_upcoming', description: 'Get upcoming matches', input_schema: { type: 'object' as const, properties: { title: { type: 'string' } }, required: [] } },
  { name: 'esports_get_tournaments', description: 'Get active tournaments', input_schema: { type: 'object' as const, properties: { title: { type: 'string' } }, required: [] } },
  { name: 'esports_predict', description: 'Predict match outcome', input_schema: { type: 'object' as const, properties: { homeTeamId: { type: 'string' }, awayTeamId: { type: 'string' }, bestOf: { type: 'number' } }, required: ['homeTeamId', 'awayTeamId'] } },
];
