import { WorldCupJellySDK } from '../../src/sdk.js';

const sdk = new WorldCupJellySDK({
  providers: { footballApi: { apiKey: process.env['FOOTBALL_API_KEY'] } },
});

async function main() {
  const fixtureId = 'wc26-match-048';
  console.log(`Building match winner context for fixture: ${fixtureId}`);

  const context = await sdk.agents.getMatchContext({ fixtureId, platform: 'POLYMARKET' });
  console.log('Match context:', JSON.stringify(context, null, 2));

  const scenarios = await sdk.prediction.scenarios.forFixture(fixtureId);
  console.log('\nOutcome scenarios:');
  for (const s of scenarios) {
    console.log(`  ${s.label}: ${(s.probability * 100).toFixed(1)}% — ${s.description}`);
  }
}

main().catch(console.error);
