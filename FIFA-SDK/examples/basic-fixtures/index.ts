import { WorldCupJellySDK } from '../../src/sdk.js';

const sdk = new WorldCupJellySDK({
  providers: {
    footballApi: { apiKey: process.env['FOOTBALL_API_KEY'] },
  },
  cache: { type: 'memory', ttlSeconds: 120 },
});

async function main() {
  console.log('Fetching group-stage fixtures for Brazil...');
  const fixtures = await sdk.fifa.fixtures.list({ stage: 'group', team: 'team-brazil' });
  console.log(`Found ${fixtures.length} fixtures:`, fixtures);

  console.log('\nFetching Group A standings...');
  const standings = await sdk.fifa.standings.group('A');
  console.log('Group A standings:', standings);

  console.log('\nFetching current bracket state...');
  const bracket = await sdk.fifa.bracket.current();
  console.log('Bracket nodes:', bracket.length);
}

main().catch(console.error);
