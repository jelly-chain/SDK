import { WorldCupJellySDK } from '../../src/sdk.js';

const sdk = new WorldCupJellySDK({
  providers: {
    footballApi: { apiKey: process.env['FOOTBALL_API_KEY'] },
    kalshi: {
      enabled: true,
      keyId: process.env['KALSHI_KEY_ID'],
      privateKey: process.env['KALSHI_PRIVATE_KEY'],
    },
  },
});

async function main() {
  const ticker = 'FIFA-WC26-ARG-WIN';
  console.log(`Reading Kalshi market: ${ticker}`);

  const market = await sdk.markets.kalshi.market(ticker);
  console.log('Kalshi market:', market);

  const context = await sdk.agents.getPredictionContext({
    question: 'Will Argentina win the 2026 FIFA World Cup?',
    platform: 'KALSHI',
  });
  console.log('\nAgent prediction context:', JSON.stringify(context, null, 2));
}

main().catch(console.error);
