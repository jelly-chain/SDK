export const WEATHER_TOOLS = [
  { name: 'weather_get_forecast', description: 'Get weather forecast for a sports venue', input_schema: { type: 'object' as const, properties: { venueId: { type: 'string' }, date: { type: 'string' } }, required: ['venueId'] } },
  { name: 'weather_assess_impact', description: 'Assess weather impact on a match', input_schema: { type: 'object' as const, properties: { venueId: { type: 'string' }, sport: { type: 'string' } }, required: ['venueId', 'sport'] } },
];
