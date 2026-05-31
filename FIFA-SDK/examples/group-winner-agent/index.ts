import { WorldCupJellySDK } from '../../src/sdk.js';

const sdk = new WorldCupJellySDK({
  providers: { footballApi: { apiKey: process.env['FOOTBALL_API_KEY'] } },
});

async function main() {
  const groupCode = 'B';
  console.log(`Analyzing Group ${groupCode} winner probabilities...`);

  const context = await sdk.agents.getGroupContext({ groupCode, platform: 'POLYMARKET' });
  console.log('Group context:', JSON.stringify(context, null, 2));

  const predictionContext = await sdk.agents.getPredictionContext({
    question: `Will France win Group ${groupCode}?`,
    platform: 'POLYMARKET',
  });
  console.log('\nPrediction context:', JSON.stringify(predictionContext, null, 2));
}

main().catch(console.error);
