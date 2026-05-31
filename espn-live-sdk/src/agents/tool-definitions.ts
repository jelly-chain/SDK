export const ESPN_TOOLS = [
  { name: 'espn_get_scores', description: 'Get live scores for a league (nfl, nba, mlb, nhl, mls, epl, ucl)', input_schema: { type: 'object' as const, properties: { league: { type: 'string' } }, required: ['league'] } },
  { name: 'espn_get_standings', description: 'Get standings for a league', input_schema: { type: 'object' as const, properties: { league: { type: 'string' } }, required: ['league'] } },
  { name: 'espn_get_schedule', description: 'Get schedule for a league and date', input_schema: { type: 'object' as const, properties: { league: { type: 'string' }, date: { type: 'string' } }, required: ['league'] } },
];
