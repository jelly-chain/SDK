import { WorldSportsSDK } from '../../src/index.js';

const sdk = new WorldSportsSDK({
  providers: {
    footballData: { apiKey: process.env['FOOTBALL_DATA_API_KEY'] },
  },
  cache: { ttlSeconds: 120 },
});

async function main() {
  console.log('Fetching Premier League standings...');
  const standings = await sdk.sports.standings.byLeague('premier-league', '2025/2026');
  console.log('Top 5:');
  standings.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. TeamId: ${s.teamId} — ${s.points} pts`);
  });

  console.log('\nFetching upcoming fixtures...');
  const fixtures = await sdk.sports.fixtures.upcoming('team-arsenal');
  console.log(`Found ${fixtures.length} upcoming fixtures`);

  console.log('\nLeague catalog (football):');
  const leagues = await sdk.sports.leagues.bySport('football');
  leagues.slice(0, 5).forEach((l) => console.log(`  - ${l.name} (${l.currentSeason})`));
}

main().catch(console.error);
