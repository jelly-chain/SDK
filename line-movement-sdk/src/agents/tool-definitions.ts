export const LINE_MOVEMENT_TOOLS = [
  { name: 'line_get_movement', description: 'Get line movement data for a fixture', input_schema: { type: 'object' as const, properties: { fixtureId: { type: 'string' }, market: { type: 'string' } }, required: ['fixtureId'] } },
  { name: 'line_detect_steam', description: 'Detect steam moves (rapid line changes)', input_schema: { type: 'object' as const, properties: { fixtureId: { type: 'string' } }, required: ['fixtureId'] } },
  { name: 'line_analyze_value', description: 'Analyze line value vs model probability', input_schema: { type: 'object' as const, properties: { fixtureId: { type: 'string' }, modelProb: { type: 'number' } }, required: ['fixtureId', 'modelProb'] } },
];
