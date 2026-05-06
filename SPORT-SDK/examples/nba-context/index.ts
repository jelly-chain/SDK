import { WorldSportsSDK } from '../../src/index.js';

const sdk = new WorldSportsSDK({
  providers: {
    ballDontLie: { apiKey: process.env['BALLDONTLIE_API_KEY'] },
    theOddsApi: { apiKey: process.env['ODDS_API_KEY'] },
  },
});

async function main() {
  console.log('NBA Context Example\n');

  const ctx = await sdk.agents.getSportsContext({
    question: 'Will the Lakers beat the Celtics in the NBA Finals?',
    platform: 'POLYMARKET',
    sport: 'basketball',
    league: 'nba',
  });

  console.log(`Sport: ${ctx.sport}`);
  console.log(`League: ${ctx.league}`);
  console.log(`Market type: ${ctx.marketType}`);
  console.log(`Confidence: ${(ctx.signals.confidence * 100).toFixed(0)}%`);
  console.log(`Explanation: ${ctx.explanation}`);
  console.log(`Risk flags: ${ctx.signals.riskFlags.join(', ') || 'none'}`);
}

main().catch(console.error);
