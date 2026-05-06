# Sports Jelly SDK

> Agent-first TypeScript SDK for multi-sport intelligence and prediction-market decision support — NBA, NFL, Football, Tennis, MLB, NHL, MMA, and F1.

**GitHub (this SDK):** [github.com/jelly-chain/SDK/tree/main/SPORT-SDK](https://github.com/jelly-chain/SDK/tree/main/SPORT-SDK)
**World Cup Jelly SDK:** [github.com/jelly-chain/SDK/tree/main/FIFA-SDK](https://github.com/jelly-chain/SDK/tree/main/FIFA-SDK)
**Jelly Claude (agent runner):** [github.com/jelly-chain/jelly-claude](https://github.com/jelly-chain/jelly-claude)

---

## What is this?

Sports Jelly SDK is a standalone TypeScript SDK that plugs into [Jelly Claude](https://github.com/jelly-chain/jelly-claude) to give it structured, real-time sports intelligence across 8 sport types and 16+ competitions. It is designed for AI agents and quantitative workflows that need reliable, normalized sports data so they can reason accurately about markets on [Polymarket](https://polymarket.com) and [Kalshi](https://kalshi.com).

Instead of asking Claude to guess about standings, form, or injury news from memory, this SDK provides evidence-backed context including confidence scores, risk flags, narrative tags, and a model disclaimer separating signals from facts.

It mirrors the architecture pattern of [world-cup-jelly-sdk](https://github.com/jelly-chain/SDK/tree/main/FIFA-SDK) but is scoped to the full multi-sport landscape — NBA, NFL, football (all major leagues), tennis grand slams, MLB, NHL, UFC, and F1.

---

## Goals

- Provide a single normalized interface for fixtures, standings, squads, form, and historical data across 8 sports.
- Help agents answer sports prediction questions with structured context instead of raw text or hallucinations.
- Map sports data into prediction-market objects and features for Polymarket and Kalshi.
- Support historical backtesting, pre-match forecasting, and live-event monitoring.
- Support 6 real data providers out of the box with a clean extension point for more.

## Non-goals

- Not a betting execution engine.
- Not a replacement for official licensed sports data feeds.
- Not a dependency of world-cup-jelly-sdk — it runs independently alongside it.

---

## Quick Start

```ts
import { WorldSportsSDK } from "sports-jelly-sdk";

const sdk = new WorldSportsSDK({
  providers: {
    ballDontLie: { apiKey: process.env.BALLDONTLIE_API_KEY },
    theOddsApi:  { apiKey: process.env.ODDS_API_KEY },
    polymarket:  { enabled: true },
  },
  cache: { type: "memory", ttlSeconds: 120 },
  agent: { format: "claude-json" }
});

// Answer any natural-language sports prediction question
const ctx = await sdk.agents.getSportsContext({
  question: "Will the Lakers beat the Celtics in the NBA Finals?",
  platform: "POLYMARKET"
});

console.log(ctx.sport);                   // "basketball"
console.log(ctx.signals.confidence);      // e.g. 0.61
console.log(ctx.signals.riskFlags);       // e.g. ["injury-concern"]
console.log(ctx.explanation);             // Human-readable reasoning
```

---

## Installing into Jelly Claude

```bash
# 1. Clone jelly-claude and the SDK repo
git clone https://github.com/jelly-chain/jelly-claude
git clone https://github.com/jelly-chain/SDK

# Your directory layout:
# ~/jelly/
#   jelly-claude/           ← agent runner
#   SDK/
#     SPORT-SDK/            ← this SDK
#     FIFA-SDK/             ← world-cup-jelly-sdk

# 2. Run the jelly-claude setup wizard
cd jelly-claude && bash setup.sh

# 3. Add your data provider keys to .env
echo "BALLDONTLIE_API_KEY=your_key" >> .env
echo "ODDS_API_KEY=your_key" >> .env

# 4. Launch the agent
bash jelly-claude.sh
```

The `skills/sports/SKILL.md` file automatically teaches Claude how to call all 4 available tools.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `BALLDONTLIE_API_KEY` | Recommended | NBA, NFL, MLB, NHL, EPL, MMA, FIFA WC |
| `SPORTS_API_KEY` | Optional | API-Sports — Football, NBA, NFL, F1, Tennis |
| `FOOTBALL_DATA_API_KEY` | Optional | football-data.org — 12 major football competitions |
| `THESPORTSDB_PATREON_KEY` | Optional | TheSportsDB v2 (v1 is free with no key) |
| `SPORTMONKS_API_KEY` | Optional | Sportmonks — Football, Cricket, F1 |
| `ODDS_API_KEY` | Recommended | Live odds — NFL, NBA, Soccer, Tennis, MLB, NHL |
| `MYSPORTSFEEDS_API_KEY` | Optional | MySportsFeeds — NFL, MLB, NBA, NHL |
| `KALSHI_KEY_ID` | Optional | Kalshi prediction market reads |
| `KALSHI_PRIVATE_KEY` | Optional | Kalshi private key auth |
| `CACHE_TTL_SECONDS` | Optional | Override default TTL (default: 120) |

---

## Architecture

```
User question
     │
     ▼
MarketQuestionParser     ← parse NL question → sport + league + MarketType + teams
     │
     ▼
SportsNamespace          ← fixtures, teams, standings, players, history
     │
     ▼
IntelligenceNamespace    ← form, matchup, injuries, upsets, narratives
     │
     ▼
PredictionNamespace      ← features → confidence → scenarios → explanation
     │
     ▼
AgentRuntime             ← assemble AgentSportsContext
     │
     ▼
ToolAdapter              ← Claude function-calling response
```

| Namespace | Purpose |
|---|---|
| `sdk.sports` | Raw data — fixtures, teams, leagues, standings, players, venues, bracket, events, results, history |
| `sdk.intelligence` | Derived signals — form, matchup, injuries, squad strength, schedule pressure, upsets, narratives, availability, league context |
| `sdk.prediction` | Market reasoning — question parsing, features, confidence, scenarios, calibration, explanation |
| `sdk.markets` | Market integration — Polymarket + Kalshi read-only clients, mappers, normalization |
| `sdk.agents` | Agent interface — Claude/Jelly-compatible tool calls, evidence bundles, Claude-format output |
| `sdk.backtesting` | Historical analysis — backtest runner, snapshot loader, Brier/log-loss scoring, markdown reports |

---

## Directory Structure

```
sports-jelly-sdk/
├── package.json                         # name: sports-jelly-sdk, v0.1.0, ESM
├── tsconfig.json                        # ESNext, strict, bundler moduleResolution
├── vitest.config.ts                     # Vitest unit test configuration
├── .env.example                         # All environment variables
│
├── src/
│   ├── index.ts                         # Public entry point
│   ├── sdk.ts                           # WorldSportsSDK class — wires all namespaces
│   ├── types.ts                         # Shared TypeScript interfaces and types
│   ├── errors.ts                        # SDK error hierarchy
│   ├── logger.ts                        # Structured singleton logger
│   ├── config.ts                        # SDKConfig — validates and applies defaults
│   │
│   ├── sports/                          # Raw sports data layer (10 files)
│   │   ├── fixtures.ts                  # Fixtures with filters
│   │   ├── teams.ts                     # Team lookup and fuzzy match
│   │   ├── leagues.ts                   # League catalog (16 leagues)
│   │   ├── standings.ts                 # League standings
│   │   ├── players.ts                   # Player profiles and availability
│   │   ├── venues.ts                    # Venue data
│   │   ├── bracket.ts                   # Knockout bracket state
│   │   ├── events.ts                    # Match events (goals, cards, etc.)
│   │   ├── results.ts                   # Match results and outcome parsing
│   │   └── history.ts                   # H2H records and historical champions
│   │
│   ├── intelligence/                    # Derived signal layer (9 files)
│   │   ├── form-engine.ts               # W/D/L form rating (0–1)
│   │   ├── matchup-engine.ts            # H2H + form matchup context
│   │   ├── injury-impact.ts             # Unavailability impact scoring
│   │   ├── squad-strength.ts            # Availability + ranking composite
│   │   ├── schedule-pressure.ts         # Rest days + turnaround flags
│   │   ├── upset-detector.ts            # Upset probability from ranking gap
│   │   ├── narrative-engine.ts          # Narrative tags (upset-alert, injury-concern)
│   │   ├── player-availability.ts       # Full availability report
│   │   └── league-context.ts            # Title race, relegation, playoff bubble
│   │
│   ├── prediction/                      # Market reasoning layer (7 files)
│   │   ├── market-question-parser.ts    # NL question → sport + league + MarketType
│   │   ├── feature-builder.ts           # Feature vector from SDK data
│   │   ├── resolution-mapper.ts         # MarketType → resolution criteria
│   │   ├── confidence-engine.ts         # 0–1 confidence score from features
│   │   ├── scenario-generator.ts        # Win/draw/loss probability scenarios
│   │   ├── probability-calibrator.ts    # Platt scaling + overround removal
│   │   └── explanation-builder.ts       # Human-readable + model disclaimer
│   │
│   ├── providers/                       # External data providers (6 providers)
│   │   ├── base-provider.ts             # AbstractProvider base class
│   │   ├── provider-manager.ts          # Provider lifecycle + health checks
│   │   ├── balldontlie/                 # BallDontLie (NBA, NFL, MLB, NHL, EPL)
│   │   ├── api-sports/                  # API-Sports.io (multi-sport)
│   │   ├── football-data/               # football-data.org v4
│   │   ├── thesportsdb/                 # TheSportsDB v1 (free) + v2 (Patreon)
│   │   ├── sportmonks/                  # Sportmonks v3
│   │   └── the-odds-api/                # The Odds API v4
│   │
│   ├── normalizers/                     # Cross-provider normalization (7 files)
│   ├── markets/                         # Polymarket + Kalshi + common (9 files)
│   ├── agents/                          # Claude/Jelly agent layer (5 files)
│   ├── cache/                           # MemoryCache + RedisCache stub + keys
│   ├── schemas/                         # Runtime type guards and sample generators
│   ├── backtesting/                     # Backtest runner, loader, scoring, reports
│   ├── replay/                          # Match replay and timeline builder
│   └── utils/                           # dates, math, strings, ids, async
│
├── examples/
│   ├── basic-fixtures/                  # Standings + upcoming fixtures
│   ├── nba-context/                     # NBA prediction context
│   ├── league-table/                    # get_league_table tool call
│   ├── polymarket-odds/                 # Search + map Polymarket markets
│   ├── match-context/                   # get_match_context + evidence bundle
│   └── claude-agent-tooling/            # Full Claude tool call simulation
│
├── docs/
│   ├── getting-started.md
│   ├── providers.md
│   ├── data-model.md
│   ├── agent-integration.md
│   ├── market-mapping.md
│   ├── caching.md
│   ├── backtesting.md
│   ├── compliance.md
│   └── roadmap.md
│
├── tests/
│   ├── sdk.test.ts                      # WorldSportsSDK init, namespaces, tool defs
│   ├── prediction-parser.test.ts        # MarketQuestionParser — 8 sports, all types
│   ├── confidence-engine.test.ts        # ConfidenceEngine — scoring, tiers, uncertainty
│   └── cache.test.ts                    # MemoryCache — TTL, CRUD, expiry
│
└── skills/
    └── sports/
        └── SKILL.md                     # Jelly Claude agent skill
```

---

## Top-Level Namespaces

### `sdk.sports` — Multi-Sport Data

| Method | Returns | Description |
|---|---|---|
| `fixtures.list(filters)` | `Fixture[]` | Filter by sport, league, team, status, stage, date |
| `fixtures.byId(id)` | `Fixture` | Fetch fixture by ID |
| `fixtures.upcoming(teamId)` | `Fixture[]` | Upcoming scheduled fixtures |
| `fixtures.recentResults(teamId, limit?)` | `Fixture[]` | Last N finished matches |
| `fixtures.live(sport?)` | `Fixture[]` | Live matches |
| `teams.list(sport?, league?)` | `Team[]` | All teams for sport/league |
| `teams.byId(id)` | `Team` | Team by normalized ID |
| `teams.byName(name, sport?)` | `Team \| undefined` | Fuzzy name match |
| `leagues.list(sport?)` | `LeagueInfo[]` | All or sport-filtered leagues |
| `leagues.byId(id)` | `LeagueInfo \| undefined` | Single league info |
| `standings.byLeague(league, season?)` | `Standing[]` | Full standings table |
| `standings.forTeam(teamId, league)` | `Standing \| undefined` | Team standing |
| `standings.topN(league, n)` | `Standing[]` | Top N teams |
| `players.byId(id)` | `Player` | Player profile |
| `players.available(teamId)` | `Player[]` | Non-injured players |
| `players.unavailable(teamId)` | `Player[]` | Injured/suspended players |
| `history.headToHead(a, b, sport)` | `HeadToHead` | H2H record |
| `history.champions(league, limit?)` | `HistoricalChampion[]` | Historical champions |

### `sdk.intelligence` — Derived Signals

| Method | Returns | Description |
|---|---|---|
| `form.team(teamId, league, window?)` | `FormRecord` | W/D/L form rating (0–1) |
| `matchup.compare({ homeTeamId, awayTeamId, sport })` | `MatchupContext` | Full matchup analysis |
| `injuries.summary(teamId)` | `InjurySummary` | Impact score + key absences |
| `squadStrength.evaluate(teamId)` | `SquadStrengthReport` | Availability + ranking + depth |
| `schedulePressure.evaluate(teamId, fixtureId?)` | `SchedulePressureReport` | Rest days + flags |
| `upsets.evaluate(fixtureId)` | `UpsetRisk \| undefined` | Upset probability |
| `narratives.forMatch(fixtureId)` | `MatchNarrative` | Tags + headline |
| `leagueContext.report(league, season?)` | `LeagueContextReport` | Title race, bubble, relegation |

### `sdk.prediction` — Market Reasoning

| Method | Returns | Description |
|---|---|---|
| `parser.parse(question)` | `ParsedMarketQuestion` | sport + league + MarketType + teams |
| `features.build({ marketType, teamIds })` | `PredictionFeatures` | Normalized feature vector |
| `confidence.score(features)` | `ConfidenceResult` | 0–1 score, tier, factors |
| `scenarios.forFixture(id)` | `Scenario[]` | Win/draw/loss probability scenarios |
| `calibrator.calibrate(raw)` | `number` | Platt-scaled probability |
| `calibrator.removeOverround(odds)` | `NormalizedOdds[]` | Remove bookmaker margin |
| `resolution.map(type, league)` | `ResolutionCriteria` | Resolution condition + timeline |
| `explanation.build(features, confidence, favored?)` | `PredictionExplanation` | Summary + disclaimer |

### Claude Tools (via `sdk.tools`)

| Tool | Input | Description |
|---|---|---|
| `resolve_sports_question` | `question`, `platform?` | Full AgentSportsContext |
| `get_match_context` | `fixtureId`, `platform?` | Match context object |
| `get_league_table` | `league`, `season?` | Standings + league context |
| `explain_sports_prediction` | `question` | Claude envelope with explanation |

---

## Running Tests

```bash
npm install
npm test
```

Expected: 4 test files, 33+ passing assertions, 0 TypeScript errors.

## Type Checking

```bash
npm run typecheck
```

---

## License

MIT — see [LICENSE](./LICENSE)
