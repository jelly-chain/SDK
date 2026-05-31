import { WorldCupJellySDK } from '../../src/sdk.js';
import { ToolAdapter } from '../../src/agents/tool-adapter.js';
import { ClaudeFormat } from '../../src/agents/claude-format.js';
import { ResponseSchema } from '../../src/agents/response-schema.js';

const sdk = new WorldCupJellySDK({
  providers: { footballApi: { apiKey: process.env['FOOTBALL_API_KEY'] } },
  agent: { format: 'claude-json' },
});

const tools     = new ToolAdapter(sdk.agents);
const formatter = new ClaudeFormat();
const schema    = new ResponseSchema();

async function main() {
  console.log('Available agent tools:');
  const defs = tools.getToolDefinitions();
  defs.forEach(d => console.log(` - ${d.name}: ${d.description}`));

  console.log('\nSimulating tool call: resolve_market_question');
  const result = await tools.execute({
    name: 'resolve_market_question',
    parameters: {
      question: 'Will England win Group C?',
      platform: 'POLYMARKET',
    },
  });
  console.log('Tool result:', JSON.stringify(result, null, 2));

  if (result.success && schema.validate(result.data)) {
    const formatted = formatter.formatPredictionContext(result.data);
    console.log('\nClaude tool output:', JSON.stringify(formatted, null, 2));
  }
}

main().catch(console.error);
