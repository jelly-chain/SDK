/**
 * Betting Odds Example
 * Odds comparison, player props, line movement.
 */
import { WorldCupJellySDK } from '../../src/sdk.js';

async function main() {
  const sdk = new WorldCupJellySDK({
    providers: { jellyApi: { apiKey: process.env['JELLY_API_KEY'] ?? '' } },
  });

  console.log('=== World Cup Jelly SDK — Betting Example ===\n');

  // Match odds
  const odds = await sdk.fifa.odds.byMatch('wc2026-match-42');
  console.log(`Odds vendors: ${odds.length}`);
  odds.forEach(o => {
    console.log(`  ${o.vendor}: Home ${o.moneylineHome} / Draw ${o.moneylineDraw} / Away ${o.moneylineAway}`);
  });

  // Best odds
  const best = await sdk.fifa.odds.bestOdds('wc2026-match-42');
  console.log(`\nBest odds: Home ${best.bestHome?.odds} (${best.bestHome?.vendor}), Away ${best.bestAway?.odds} (${best.bestAway?.vendor})`);

  // Futures
  const futures = await sdk.fifa.odds.futures([2026]);
  console.log(`\nFutures markets: ${futures.length}`);
  futures.slice(0, 5).forEach(f => {
    console.log(`  ${f.teamName}: ${f.americanOdds} (${f.vendor}) — implied ${(f.impliedProbability! * 100).toFixed(1)}%`);
  });

  // Line movement
  const movement = await sdk.fifa.odds.lineDirection('wc2026-match-42');
  console.log(`\nLine direction: ${movement.direction} (magnitude: ${movement.magnitude})`);
}

main().catch(console.error);
