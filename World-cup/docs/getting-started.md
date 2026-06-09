# Getting Started — World Cup Jelly SDK

## Installation

```bash
npm install world-cup-jelly-sdk
```

## Quick Start

```typescript
import { WorldCupJellySDK } from 'world-cup-jelly-sdk';

const sdk = new WorldCupJellySDK({
  providers: { jellyApi: { apiKey: process.env.JELLY_API_KEY } },
});

// List all 2026 teams
const teams = await sdk.fifa.teams.list({ season: 2026 });

// Get group standings
const standings = await sdk.fifa.groups.standings('A', 2026);

// Get match odds
const odds = await sdk.fifa.odds.byMatch('wc2026-match-42');

// Get shot map
const shots = await sdk.fifa.stats.shots('wc2026-match-42');

// Agent tools
const tools = sdk.agents.getToolDefinitions();
const result = await sdk.agents.execute({
  name: 'resolve_market_question',
  parameters: { question: 'Will Brazil win Group G?' },
});
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `providers.jellyApi.apiKey` | `JELLY_API_KEY` env | API key for api.jellychain.fun |
| `providers.jellyApi.baseUrl` | `https://api.jellychain.fun` | API base URL |
| `cache.ttlSeconds` | 120 | Cache TTL |
| `cache.type` | `memory` | `memory` or `redis` |
| `agent.format` | `claude-json` | Output format for agent tools |

## Architecture

```
WorldCupJellySDK
├── fifa (domain modules)
│   ├── teams — Team profiles, rosters, form
│   ├── matches — Fixtures, events, lineups, summaries
│   ├── players — Player profiles, stats, search
│   ├── venues — Stadium profiles
│   ├── groups — Group listings, standings
│   ├── standings — Group tables, tiebreaks
│   ├── rosters — Tournament squad entries
│   ├── stats — Player/team match stats, shots, momentum
│   └── odds — Betting odds, futures, player props
├── intelligence
│   └── engine — Match predictions, ratings, upset detection
├── prediction
│   └── module — Market question parsing, confidence scoring
└── agents
    └── ToolAdapter — 39+ tools for Claude Code / JellyOS
```
