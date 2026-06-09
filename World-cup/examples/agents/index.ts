/**
 * Agent Tooling Example
 * Claude Code / JellyOS function calling with 39+ tools.
 */
import { WorldCupJellySDK } from '../../src/sdk.js';

async function main() {
  const sdk = new WorldCupJellySDK({
    providers: { jellyApi: { apiKey: process.env['JELLY_API_KEY'] ?? '' } },
  });

  console.log('=== World Cup Jelly SDK — Agent Tooling ===\n');

  // List available tools
  const tools = sdk.agents.getToolDefinitions();
  console.log(`Available tools: ${tools.length}`);
  tools.forEach(t => console.log(`  ${t.name}: ${t.description.slice(0, 80)}...`));

  // Execute a tool call
  const result = await sdk.agents.execute({
    name: 'resolve_market_question',
    parameters: { question: 'Will Brazil win Group G in 2026?', platform: 'POLYMARKET' },
  });

  console.log('\nTool result:', JSON.stringify(result.data, null, 2));

  // Search teams
  const searchResult = await sdk.agents.execute({
    name: 'search_teams',
    parameters: { query: 'Brazil', limit: 3 },
  });
  console.log('\nTeam search:', JSON.stringify(searchResult.data, null, 2));

  // Compare teams
  const compareResult = await sdk.agents.execute({
    name: 'compare_teams',
    parameters: { teamA: 'team-brazil', teamB: 'team-argentina' },
  });
  console.log('\nTeam comparison:', JSON.stringify(compareResult.data, null, 2));
}

main().catch(console.error);
