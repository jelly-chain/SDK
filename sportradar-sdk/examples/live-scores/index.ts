/**
 * Example: Get live football scores from Sportradar
 */
import { SportradarClient, SportradarAdapter } from '../../src/index.js';

async function main() {
  const client = new SportradarClient({
    apiKey: process.env.SPORTRADAR_API_KEY ?? '',
  });

  if (!client.enabled) {
    console.error('Sportradar API key not set. Set SPORTRADAR_API_KEY environment variable.');
    process.exit(1);
  }

  const adapter = new SportradarAdapter();

  // Get live football matches
  console.log('Fetching live football matches...');
  const liveMatches = await client.getLiveMatches('sr:sport:1');
  const normalized = adapter.normalizeMatches(liveMatches);

  console.log(`\nFound ${normalized.length} live matches:\n`);
  for (const match of normalized) {
    console.log(`🔴 ${match.homeTeam.name} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${match.awayTeam.name}`);
    console.log(`   Venue: ${match.venue ?? 'TBD'}`);
    console.log(`   Status: ${match.status}`);
    console.log('');
  }
}

main().catch(console.error);
