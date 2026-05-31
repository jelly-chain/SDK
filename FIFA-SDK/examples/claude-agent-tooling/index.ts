import { WorldSportsSDK } from '../../src/index.js';

const sdk = new WorldSportsSDK({
  providers: { polymarket: { enabled: true } },
  agent: { format: 'claude-json' },
});

async function main() {
  console.log('Claude Agent Tooling Example\n');

  const toolDefs = sdk.getToolDefinitions();
  console.log(`Registered ${toolDefs.length} tools for Claude function calling:\n`);
  for (const def of toolDefs) {
    console.log(`  [${def.name}]`);
    console.log(`    ${def.description}`);
    const required = def.input_schema.required?.join(', ') ?? 'none';
    console.log(`    Required params: ${required}`);
  }

  console.log('\nSimulating Claude calling resolve_sports_question...\n');
  const result = await sdk.tools.execute({
    name: 'resolve_sports_question',
    parameters: {
      question: 'Will Real Madrid win the Champions League this season?',
      platform: 'POLYMARKET',
    },
  });

  if (result.success) {
    const ctx = result.data as Record<string, unknown>;
    const signals = ctx['signals'] as Record<string, unknown> | undefined;
    console.log(`  Sport: ${ctx['sport']}`);
    console.log(`  League: ${ctx['league']}`);
    console.log(`  Confidence: ${signals ? ((signals['confidence'] as number) * 100).toFixed(0) : '?'}%`);
    console.log(`  Explanation: ${ctx['explanation']}`);
  } else {
    console.error(`  Error: ${result.error}`);
  }

  console.log('\nSimulating explain_sports_prediction...\n');
  const explain = await sdk.tools.execute({
    name: 'explain_sports_prediction',
    parameters: { question: 'Will the Chiefs repeat as NFL Super Bowl winners?' },
  });

  if (explain.success) {
    const env = explain.data as Record<string, unknown>;
    console.log(`  Tool: ${env['tool']}, Version: ${env['version']}`);
  }
}

main().catch(console.error);
