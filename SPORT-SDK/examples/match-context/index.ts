import { WorldSportsSDK } from '../../src/index.js';

const sdk = new WorldSportsSDK();

async function main() {
  console.log('Match Context Example\n');

  const result = await sdk.tools.execute({
    name: 'get_match_context',
    parameters: { fixtureId: 'fixture-team-arsenal-vs-team-chelsea-20260315' },
  });

  if (result.success) {
    const data = result.data as Record<string, unknown>;
    console.log('Match context fetched successfully');
    console.log('Keys:', Object.keys(data).join(', '));
  } else {
    console.log(`Could not load fixture (expected with stub data): ${result.error}`);
  }

  console.log('\nBuilding evidence bundle...');
  const bundle = await sdk.agents.buildEvidenceBundle({
    teamIds: ['team-arsenal', 'team-chelsea'],
    sport: 'football',
  });
  const teams = (bundle as Record<string, unknown>)['teams'] as unknown[];
  console.log(`Evidence bundle contains ${teams.length} team records`);
}

main().catch(console.error);
