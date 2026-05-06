import { WorldSportsSDK } from '../../src/index.js';

const sdk = new WorldSportsSDK();

async function main() {
  console.log('League Table + Context Example\n');

  const tool = sdk.tools;
  const result = await tool.execute({
    name: 'get_league_table',
    parameters: { league: 'premier-league', season: '2025/2026' },
  });

  if (result.success) {
    const data = result.data as Record<string, unknown>;
    console.log(`League: ${data['league']}`);
    const context = data['context'] as Record<string, unknown> | undefined;
    if (context) {
      console.log(`Top team: ${context['topTeam']}`);
      console.log(`Title race: ${(context['titleRace'] as string[] | undefined)?.join(', ')}`);
    }
  } else {
    console.error(`Error: ${result.error}`);
  }
}

main().catch(console.error);
