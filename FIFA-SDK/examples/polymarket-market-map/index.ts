import { WorldCupJellySDK } from '../../src/sdk.js';

const sdk = new WorldCupJellySDK({
  providers: {
    footballApi: { apiKey: process.env['FOOTBALL_API_KEY'] },
    polymarket: { enabled: true },
  },
});

async function main() {
  const question = 'Will Brazil win the 2026 FIFA World Cup?';
  console.log(`Mapping Polymarket question: "${question}"`);

  const parsed = sdk.prediction.parser.parse(question);
  console.log('Parsed:', parsed);

  const market = await sdk.markets.polymarket.find({ query: question });
  console.log('Polymarket market found:', market);

  const mapped = sdk.markets.common.resolveQuestion(question);
  console.log('Platform resolution:', mapped);

  const predContext = await sdk.agents.getPredictionContext({ question, platform: 'POLYMARKET' });
  console.log('\nFull prediction context:', JSON.stringify(predContext, null, 2));
}

main().catch(console.error);
