import { WorldSportsSDK } from '../../src/index.js';

const sdk = new WorldSportsSDK({ providers: { polymarket: { enabled: true } } });

async function main() {
  console.log('Polymarket Sports Markets Example\n');

  const markets = await sdk.markets.polymarket.search('NBA champion');
  console.log(`Found ${markets.length} markets for "NBA champion"`);

  for (const m of markets.slice(0, 3)) {
    const prob = sdk.markets.polymarket.extractProbability(m);
    const mapped = sdk.markets.polymarketMapper.map(m);
    console.log(`\n  ${m.question}`);
    console.log(`  Probability: ${(prob * 100).toFixed(1)}%`);
    console.log(`  Sport: ${mapped.sport}, League: ${mapped.league}`);
    console.log(`  Market type: ${mapped.marketType}`);
    console.log(`  Volume: $${m.volume?.toLocaleString() ?? 'N/A'}`);
  }
}

main().catch(console.error);
