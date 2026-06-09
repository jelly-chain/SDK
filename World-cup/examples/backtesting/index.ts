/**
 * Backtesting Example
 * Test betting strategies against historical World Cup data.
 */
import { WorldCupJellySDK } from '../../src/sdk.js';

async function main() {
  const sdk = new WorldCupJellySDK({
    providers: { jellyApi: { apiKey: process.env['JELLY_API_KEY'] ?? '' } },
  });

  console.log('=== World Cup Jelly SDK — Backtesting ===\n');

  // Get historical matches
  const matches = await sdk.fifa.matches.list({ season: 2022, status: 'completed' });
  console.log(`Historical matches (2022): ${matches.matches.length}`);

  // Simple strategy: bet on favorites (top 5 FIFA ranked)
  const topTeams = await sdk.fifa.teams.topRanked(5, 2022);
  const topIds = new Set(topTeams.map(t => t.id));

  let wins = 0, losses = 0, total = 0;
  for (const match of matches.matches.slice(0, 20)) {
    if (match.homeScore == null || match.awayScore == null) continue;
    const homeIsFavorite = topIds.has(match.homeTeamId);
    const awayIsFavorite = topIds.has(match.awayTeamId);
    if (!homeIsFavorite && !awayIsFavorite) continue;

    total++;
    const predictedWinner = homeIsFavorite ? 'home' : 'away';
    const actualWinner = match.homeScore > match.awayScore ? 'home' : match.awayScore > match.homeScore ? 'away' : 'draw';
    if (predictedWinner === actualWinner) wins++;
    else losses++;
  }

  console.log(`\nStrategy: Bet on top-5 FIFA ranked teams`);
  console.log(`Total bets: ${total}, Wins: ${wins}, Losses: ${losses}`);
  console.log(`Win rate: ${total > 0 ? ((wins / total) * 100).toFixed(1) : 0}%`);
}

main().catch(console.error);
