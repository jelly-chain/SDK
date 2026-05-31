/**
 * Example: Build prediction context from Sportradar data
 */
import { SportradarClient, SportradarAdapter, ResponseFormatter } from '../../src/index.js';

async function main() {
  const client = new SportradarClient({
    apiKey: process.env.SPORTRADAR_API_KEY ?? '',
  });

  const adapter = new SportradarAdapter();

  // Get EPL schedule
  console.log('Fetching EPL schedule...');
  const schedule = await client.getSchedule('sr:season:12345');

  if (schedule.length === 0) {
    console.log('No matches found.');
    return;
  }

  // Get first upcoming match
  const match = schedule[0];
  console.log(`\nBuilding context for: ${match.home.name} vs ${match.away.name}`);

  // Get standings
  const standings = await client.getStandings('sr:season:12345');
  const normalizedStandings = standings ? adapter.normalizeStandings(standings) : [];

  // Get injuries
  const injuries = await client.getInjuries('sr:tournament:17');
  const normalizedInjuries = adapter.normalizeInjuries(injuries);

  // Format for prediction
  const context = ResponseFormatter.formatForPrediction({
    match,
    standings: standings ?? undefined,
    injuries,
  });

  console.log('\n=== Prediction Context ===\n');
  console.log(context);
}

main().catch(console.error);
