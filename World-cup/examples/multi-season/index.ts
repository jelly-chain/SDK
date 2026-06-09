/**
 * Multi-Season Analysis Example
 * Compare team performance across 2018, 2022, 2026.
 */
import { WorldCupJellySDK } from '../../src/sdk.js';

async function main() {
  const sdk = new WorldCupJellySDK({
    providers: { jellyApi: { apiKey: process.env['JELLY_API_KEY'] ?? '' } },
  });

  console.log('=== World Cup Jelly SDK — Multi-Season Analysis ===\n');

  const seasons = [2018, 2022, 2026] as const;

  for (const season of seasons) {
    console.log(`\n--- ${season} World Cup ---`);

    const teams = await sdk.fifa.teams.list({ season });
    console.log(`Teams: ${teams.length}`);

    const standings = await sdk.fifa.groups.allStandings(season);
    console.log(`Standings entries: ${standings.length}`);

    const matches = await sdk.fifa.matches.list({ season, status: 'completed' });
    console.log(`Completed matches: ${matches.matches.length}`);

    if (matches.matches.length > 0) {
      const totalGoals = matches.matches.reduce((sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
      console.log(`Total goals: ${totalGoals}, Avg per match: ${(totalGoals / matches.matches.length).toFixed(2)}`);
    }
  }
}

main().catch(console.error);
