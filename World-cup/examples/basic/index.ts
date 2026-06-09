/**
 * Basic World Cup SDK Usage
 * Teams, matches, standings, players.
 */
import { WorldCupJellySDK } from '../../src/sdk.js';

async function main() {
  const sdk = new WorldCupJellySDK({
    providers: { jellyApi: { apiKey: process.env['JELLY_API_KEY'] ?? '' } },
  });

  console.log('=== World Cup Jelly SDK — Basic Example ===\n');

  // List all 2026 teams
  const teams = await sdk.fifa.teams.list({ season: 2026 });
  console.log(`Teams: ${teams.length}`);
  teams.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.shortName}) — FIFA #${t.fifaRanking ?? 'N/A'}`));

  // Group standings
  const standings = await sdk.fifa.groups.standings('A', 2026);
  console.log('\nGroup A Standings:');
  standings.forEach(s => console.log(`  P${s.position}. ${s.teamName} — ${s.points}pts (${s.won}W ${s.drawn}D ${s.lost}L)`));

  // Live matches
  const live = await sdk.fifa.matches.live();
  console.log(`\nLive matches: ${live.length}`);
  live.forEach(m => console.log(`  ${m.homeTeamId} ${m.homeScore} - ${m.awayScore} ${m.awayTeamId}`));

  // Top ranked
  const top = await sdk.fifa.teams.topRanked(5, 2026);
  console.log('\nTop 5 FIFA Rankings:');
  top.forEach(t => console.log(`  #${t.fifaRanking} ${t.name}`));
}

main().catch(console.error);
