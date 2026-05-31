# Sportradar Jelly SDK

> **30 files · 7 sports modules · Tier 1 sports data for JellyOS prediction agents.**

## What is this?

Sportradar Jelly SDK provides agent-first access to Sportradar's premium sports data API. This is the same data provider that Polymarket and Kalshi use for market settlement — making it the gold standard for sports prediction accuracy.

## Architecture

```
sportradar-sdk/ (30 files)
├── src/
│   ├── agents/                    Agent integration layer
│   │   ├── index.ts               Barrel exports
│   │   ├── response-formatter.ts  Agent-friendly output formatting
│   │   └── tool-definitions.ts    Claude tool definitions (8 tools)
│   │
│   ├── sports/                    Sport-specific modules (7 sports)
│   │   ├── index.ts               Barrel exports
│   │   ├── football.ts            EPL, La Liga, UCL, World Cup
│   │   ├── basketball.ts          NBA, EuroLeague
│   │   ├── tennis.ts              🆕 ATP, WTA, Grand Slams, surface analysis
│   │   ├── baseball.ts            🆕 MLB, pitcher/batter matchups, park factors
│   │   ├── hockey.ts              🆕 NHL, goalie matchups, special teams
│   │   ├── mma.ts                 🆕 UFC, fight cards, fighter comparison
│   │   └── formula1.ts            🆕 F1, race predictions, circuit analysis
│   │
│   ├── adapter.ts                 Data normalization to JellyOS format
│   ├── cache.ts                   In-memory caching with TTL
│   ├── client.ts                  Sportradar API client
│   ├── errors.ts                  Error hierarchy
│   ├── index.ts                   Public entry point
│   ├── types.ts                   TypeScript type definitions
│   └── validators.ts              Input validation
│
├── skills/sportradar/             Agent skill
│   ├── SKILL.md                   Skill documentation
│   └── skill.metadata.json        Skill metadata
│
├── tests/                         Test suite
│   ├── adapter.test.ts            Adapter tests
│   ├── cache.test.ts              Cache tests
│   └── client.test.ts             Client tests
│
├── examples/                      Usage examples
│   ├── live-scores/index.ts       Live scores example
│   └── prediction-context/index.ts Prediction context example
│
├── .env.example                   Environment template
├── package.json                   Dependencies
├── README.md                      This file
├── tsconfig.json                  TypeScript config
└── vitest.config.ts               Test config
```

## Sports Coverage

| Sport | Module | Leagues | Key Features |
|-------|--------|---------|--------------|
| Football | `football.ts` | EPL, La Liga, Bundesliga, Serie A, Ligue 1, UCL, World Cup | Live scores, standings, injuries |
| Basketball | `basketball.ts` | NBA, EuroLeague | Live scores, player stats |
| Tennis | `tennis.ts` | ATP, WTA, Grand Slams | Surface analysis, draw tracking |
| Baseball | `baseball.ts` | MLB | Pitcher/batter matchups, park factors |
| Ice Hockey | `hockey.ts` | NHL | Goalie matchups, special teams |
| MMA | `mma.ts` | UFC, Bellator | Fight cards, fighter comparison |
| Formula 1 | `formula1.ts` | F1 | Race predictions, circuit analysis |

## Agent Tools (8)

| Tool | Description |
|------|-------------|
| `sportradar_get_sports` | Get all available sports |
| `sportradar_get_live_matches` | Get live matches for a sport |
| `sportradar_get_schedule` | Get scheduled matches for a season |
| `sportradar_get_match_summary` | Get detailed match summary |
| `sportradar_get_standings` | Get league standings |
| `sportradar_get_injuries` | Get injury reports |
| `sportradar_get_play_by_play` | Get play-by-play timeline |
| `sportradar_get_player_stats` | Get player statistics |

## Quick Start

```typescript
import { SportradarClient, SportradarAdapter } from 'sportradar-jelly-sdk';

const client = new SportradarClient({ apiKey: process.env.SPORTRADAR_API_KEY });
const adapter = new SportradarAdapter();

// Get live football matches
const live = await client.getLiveMatches('sr:sport:1');
const normalized = adapter.normalizeMatches(live);

// Get EPL standings
const standings = await client.getStandings('sr:season:12345');
const normalizedStandings = adapter.normalizeStandings(standings!);

// Get injuries for prediction context
const injuries = await client.getInjuries('sr:tournament:17');
```

## JellyOS Integration

This SDK integrates with:
- **SPORT-SDK** — Primary data source for multi-sport predictions
- **FIFA-SDK** — World Cup specific data enrichment
- **weather-venue-sdk** — Venue weather correlation
- **line-movement-sdk** — Odds movement context
- **polymarket-clob-sdk** — Market settlement verification
- **kalshi-v3-sdk** — Market settlement verification

## License

MIT — Jelly Chain
