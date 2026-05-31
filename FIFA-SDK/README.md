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

## Sport & League Coverage

| Sport | `Sport` value | Leagues / Competitions (`League` value) |
|---|---|---|
| Football / Soccer | `football` | `premier-league`, `la-liga`, `bundesliga`, `serie-a`, `ligue-1`, `champions-league`, `europa-league`, `mls`, `fifa-world-cup` |
| Basketball | `basketball` | `nba`, `wnba`, `ncaab`, `euroleague` |
| American Football | `american-football` | `nfl`, `ncaaf` |
| Tennis | `tennis` | `wimbledon`, `us-open`, `australian-open`, `french-open`, `atp`, `wta` |
| Baseball | `baseball` | `mlb` |
| Ice Hockey | `ice-hockey` | `nhl` |
| MMA | `mma` | `ufc` |
| Formula 1 | `formula1` | `f1` |

All `League` values are lowercase hyphenated strings. `League` also accepts `string` for custom/regional competitions not listed above.

---

## Supported `SportMarketType` Values

| Value | Description | Sports |
|---|---|---|
| `MATCH_WINNER` | Single match result (1X2 / moneyline) | All sports |
| `SERIES_WINNER` | Best-of-N series outcome | NBA, NHL, MLB playoffs |
| `LEAGUE_WINNER` | Season competition winner | Football, NBA, NFL, MLB, NHL |
| `DIVISION_WINNER` | Division / conference title | NFL, NBA, MLB |
| `CONFERENCE_WINNER` | Conference championship | NFL, NBA |
| `CHAMPIONSHIP_WINNER` | Overall tournament champion | All sports |
| `OVER_UNDER` | Total points/goals over or under a line | All sports |
| `SPREAD` | Point spread / Asian handicap | NFL, NBA, Football |
| `MONEYLINE` | Two-way win market (no draw) | NBA, NFL, MLB, NHL, Tennis |
| `PLAYER_PROP` | Individual player performance | All sports |
| `FIRST_GOAL_SCORER` | First goal scorer | Football, NHL |
| `BOTH_TEAMS_TO_SCORE` | Both teams net at least one goal | Football |
| `CORRECT_SCORE` | Exact scoreline | Football |
| `TOP_SCORER` | Golden boot / leading scorer | Football, Basketball |
| `MVP` | Season/playoff most valuable player | NBA, NFL, MLB, NHL |
| `QUALIFICATION` | Team advances to next round | Football, Tennis, NBA Playoffs |
| `RELEGATION` | Team is relegated at end of season | Football |

---

## ID Conventions

All entity IDs in this SDK are **normalized string slugs** — not numeric provider IDs. This makes them stable across provider switches.

| Entity | ID format | Example |
|---|---|---|
| Team | `{sport}-{slug}` | `football-arsenal`, `basketball-lakers` |
| Player | `{sport}-{teamSlug}-{playerSlug}` | `basketball-lakers-lebron-james` |
| Fixture | `{league}-{homeSlug}-v-{awaySlug}-{YYYYMMDD}` | `premier-league-arsenal-v-chelsea-20250308` |
| League | Hyphenated string | `premier-league`, `nba`, `f1` |

Use the utility helpers to construct IDs:

```ts
import { buildTeamId, buildPlayerId, buildFixtureId } from "sports-jelly-sdk";

const teamId   = buildTeamId("football", "Arsenal");         // "football-arsenal"
const playerId = buildPlayerId("basketball", "Lakers", "LeBron James");
const fixtureId = buildFixtureId("premier-league", "Arsenal", "Chelsea", "2025-03-08");
```

---

## Caching

The SDK uses an in-memory TTL cache by default. No external dependency is required.

| Setting | Default | Override |
|---|---|---|
| TTL | 120 seconds | `CACHE_TTL_SECONDS` env var or `cache.ttlSeconds` in config |
| Max entries | Unlimited (unbounded map) | N/A in v0.1 |
| Eviction | Passive (check on get) | N/A |
| Namespacing | `sport:module:key` pattern (see `CacheKeys`) | — |

```ts
const sdk = new WorldSportsSDK({
  cache: { type: "memory", ttlSeconds: 60 },  // 60-second TTL
});

// Or override via environment variable:
// CACHE_TTL_SECONDS=300
```

Cache keys follow the `CacheKeys` helper pattern:
- `fixtures:{league}:{status}` — fixture lists
- `standings:{league}:{season}` — standings tables
- `h2h:{teamA}-vs-{teamB}:{sport}` — head-to-head records
- `poly:snapshot:{conditionId}` — Polymarket snapshots
- `kalshi:snapshot:{ticker}` — Kalshi snapshots

A Redis cache adapter is planned for v0.4 to support multi-instance deployments.

---

## Provider Comparison

| Provider | Sports Covered | Free Tier | Paid Tier | Sign Up |
|---|---|---|---|---|
| **BallDontLie** | NBA, NFL, MLB, NHL, EPL, MMA, FIFA WC | ✅ Free (rate-limited) | $9.99/mo (All Access) | [app.balldontlie.io](https://app.balldontlie.io) |
| **API-Sports** | 30+ sports incl. Football, Basketball, F1, Tennis | ✅ 100 req/day free | €10/mo per sport | [api-sports.io](https://api-sports.io) |
| **football-data.org** | 12 major football competitions (EPL, CL, etc.) | ✅ Free (10 req/min) | €50/mo (all comps) | [football-data.org](https://www.football-data.org/client/register) |
| **TheSportsDB** | Football, Basketball, Baseball, Hockey, Tennis | ✅ v1 Free (no key) | $3–10/mo Patreon (v2) | [thesportsdb.com/patreon](https://www.patreon.com/thesportsdb) |
| **Sportmonks** | Football (most complete), Cricket, F1 | ❌ Trial only | €35–200/mo | [sportmonks.com](https://www.sportmonks.com/register/) |
| **The Odds API** | NFL, NBA, Soccer, Tennis, MLB, NHL, MMA | ✅ 500 req/month free | $10–80/mo | [the-odds-api.com](https://the-odds-api.com/#get-access) |

> **Recommended minimum setup (no cost):** Set `BALLDONTLIE_API_KEY` (free) + `ODDS_API_KEY` (500 free requests/month). This gives you NBA/NFL/MLB/NHL data and live odds for all major markets.

---

## Complete Environment Variable Reference

| Variable | Provider | Free Tier | Purpose |
|---|---|---|---|
| `BALLDONTLIE_API_KEY` | BallDontLie | ✅ 5 req/min | NBA, NFL, MLB, NHL, EPL, MMA, FIFA WC data |
| `SPORTS_API_KEY` | API-Sports | ✅ 100 req/day | Multi-sport: Football, Basketball, F1, Tennis, Baseball |
| `FOOTBALL_DATA_API_KEY` | football-data.org | ✅ 10 req/min | EPL, Bundesliga, La Liga, Serie A, Champions League (12 comps) |
| `SPORTMONKS_API_KEY` | Sportmonks | ⚠️ Trial only | Football fixtures, lineups, xG, odds (Europe-focused) |
| `ODDS_API_KEY` | The Odds API | ✅ 500 req/month | Live h2h odds — NFL, NBA, Soccer, Tennis, MLB, NHL, MMA |
| `MYSPORTSFEEDS_API_KEY` | MySportsFeeds | ✅ Free for personal use | NFL, MLB, NBA, NHL historical and current season data |
| `THESPORTSDB_PATREON_KEY` | TheSportsDB | ✅ v1 keyless; key for v2 | v2 Patreon key for live scores and full squad data |
| `SPORTSDATA_IO_KEY` | SportsDataIO | ⚠️ 14-day trial (scrambled) | NFL, NBA, MLB, NHL, Tennis, Golf, Soccer |
| `SPORTRADAR_API_KEY` | Sportradar | ❌ Enterprise B2B | 80+ sports — enterprise licensing only |
| `ISPORTS_API_KEY` | iSports API | ✅ Freemium | Football (1600+ leagues), Basketball (300+ leagues), strong Asia-Pacific coverage |
| `KALSHI_KEY_ID` | Kalshi | ❌ Auth required | Kalshi prediction market reads — Key ID portion of RSA/Ed25519 keypair |
| `KALSHI_PRIVATE_KEY` | Kalshi | ❌ Auth required | Kalshi private key (PEM string); paired with `KALSHI_KEY_ID` |
| `CACHE_TTL_SECONDS` | Internal | `120` | Override in-memory cache TTL (seconds) globally |
| `SDK_DEBUG` | Internal | `""` (disabled) | Set to `"true"` to enable verbose debug logging |

If no keys are set the SDK initialises normally — all provider clients return empty arrays with a `ProviderError` logged at `debug` level. The only exception is TheSportsDB v1, which works without any key.

---

## Relation to world-cup-jelly-sdk and Prediction-V2

### world-cup-jelly-sdk

`world-cup-jelly-sdk` (FIFA-SDK) covers **FIFA World Cup only** — group stages, knockout rounds, and tournament-specific markets. It is a self-contained SDK, not a dependency of this one.

`sports-jelly-sdk` is the multi-sport successor: it covers the same agent-tool contract (`resolve_*, get_*, explain_*`) but across 8 sports and 16+ competitions. The two SDKs share no runtime code but follow the same architecture:

```
world-cup-jelly-sdk        sports-jelly-sdk
──────────────────         ───────────────────────────────────
WorldCupSDK                WorldSportsSDK
fixtures.byGroup()         fixtures.list({ sport, league })
standings.group()          standings.byLeague()
resolve_market_question    resolve_sports_question
get_fixture_context        get_match_context
get_group_table            get_league_table
explain_world_cup_...      explain_sports_prediction
```

Both SDKs can run simultaneously inside a single Jelly Claude session — one skill file per SDK.

### Prediction-V2

Prediction-V2 is the upstream quantitative model layer. It produces calibrated probability distributions for match outcomes. `sports-jelly-sdk` acts as the **data and context layer** that feeds Prediction-V2:

```
sports-jelly-sdk (context + features)
        │
        ▼
Prediction-V2 (calibrated model output)
        │
        ▼
Polymarket / Kalshi market readers (market-implied probabilities)
        │
        ▼
AgentRuntime → Claude tool response
```

`ConfidenceEngine` in this SDK provides a lightweight local heuristic score (0–1) that can be replaced or overridden with Prediction-V2 output via `ProbabilityCalibrator.calibrate()`.

---

## Markets — Polymarket & Kalshi Readers

Both market clients expose a **reader** for snapshot and price band access without needing to instantiate the full SDK:

```ts
import { PolymarketReader, KalshiReader } from "sports-jelly-sdk";

// Polymarket — find and snapshot a market
const poly = new PolymarketReader(polymarketClient, cache);
const snap = await poly.findForQuestion("Will Arsenal win the Premier League?");
console.log(snap?.impliedProbability); // e.g. 0.34

// Kalshi — list all open sports markets
const kalshi = new KalshiReader(kalshiClient, cache);
const markets = await kalshi.sportMarkets();
const top = kalshi.topByVolume(markets, 5);

// Detect cross-platform arbitrage
const arb = kalshi.detectArbitrage(0.62, 0.55, 0.03);
console.log(arb); // { isArbitrage: true, divergence: 0.07, direction: "kalshi-higher" }
```

| Reader | Class | Key Methods |
|---|---|---|
| `PolymarketReader` | `src/markets/polymarket/reader.ts` | `snapshot()`, `search()`, `findForQuestion()`, `priceBand()`, `topByVolume()` |
| `KalshiReader` | `src/markets/kalshi/reader.ts` | `snapshot()`, `sportMarkets()`, `priceBand()`, `detectArbitrage()`, `topByVolume()` |

---

## Compliance

- This SDK is for **informational and research purposes only**.
- It does not execute trades, place bets, or submit orders on any platform.
- All data is sourced from third-party APIs — accuracy depends on those providers.
- Check local regulations before using prediction market data for financial decisions.
- See [`docs/compliance.md`](./docs/compliance.md) for full disclaimer.

---

## Roadmap

| Version | Milestone |
|---|---|
| `0.1.0` | Core architecture: 6 providers, 8 sports, 4 Claude tools, Polymarket + Kalshi readers, backtesting framework |
| `0.2.0` | Live provider hydration — real data flowing through all namespace modules |
| `0.3.0` | Prediction-V2 integration — calibrated model output replaces heuristic confidence |
| `0.4.0` | Redis cache support, multi-instance deployments |
| `0.5.0` | WebSocket live match events, replay streaming |
| `1.0.0` | Stable public API, full provider coverage, production-grade error budgets |

See [`docs/roadmap.md`](./docs/roadmap.md) for full detail.

---

## Running Tests

```bash
npm install
npm test
```

Expected: 4 test files, 46 passing assertions, 0 TypeScript errors.

## Type Checking

```bash
npm run typecheck
```

---

## License

MIT — see [LICENSE](./LICENSE)
