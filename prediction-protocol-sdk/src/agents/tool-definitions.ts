export const PROTOCOL_TOOLS = [
  { name: 'protocol_get_gnosis_market', description: 'Get Gnosis CTF market data', input_schema: { type: 'object' as const, properties: { conditionId: { type: 'string' } }, required: ['conditionId'] } },
  { name: 'protocol_get_augur_market', description: 'Get Augur market data', input_schema: { type: 'object' as const, properties: { marketId: { type: 'string' } }, required: ['marketId'] } },
  { name: 'protocol_check_settlement', description: 'Check settlement status across protocols', input_schema: { type: 'object' as const, properties: { marketId: { type: 'string' }, protocol: { type: 'string' } }, required: ['marketId'] } },
];
