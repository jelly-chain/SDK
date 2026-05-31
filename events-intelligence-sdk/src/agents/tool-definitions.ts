export const EVENTS_TOOLS = [
  { name: 'events_search', description: 'Search events by keyword, city, or category', input_schema: { type: 'object' as const, properties: { keyword: { type: 'string' }, city: { type: 'string' }, category: { type: 'string' } }, required: [] } },
  { name: 'events_analyze_signal', description: 'Analyze event for market signal', input_schema: { type: 'object' as const, properties: { eventId: { type: 'string' } }, required: ['eventId'] } },
];
