export const SOCIAL_SENTIMENT_TOOLS = [
  { name: 'sentiment_analyze', description: 'Analyze sentiment for a topic from social media', input_schema: { type: 'object' as const, properties: { topic: { type: 'string' } }, required: ['topic'] } },
  { name: 'sentiment_detect_spike', description: 'Detect volume spikes in social mentions', input_schema: { type: 'object' as const, properties: { topic: { type: 'string' } }, required: ['topic'] } },
  { name: 'sentiment_detect_drama', description: 'Detect drama/incidents in social posts', input_schema: { type: 'object' as const, properties: { topic: { type: 'string' } }, required: ['topic'] } },
];
