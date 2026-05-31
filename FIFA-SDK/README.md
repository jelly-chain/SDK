# World Cup Jelly SDK

> Agent-first TypeScript SDK for FIFA World Cup data, structured football context, and prediction-market decision support.

**GitHub (this SDK):** [github.com/jelly-chain/SDK/tree/main/FIFA-SDK](https://github.com/jelly-chain/SDK/tree/main/FIFA-SDK)
**Prediction SDK (v2):** [github.com/jelly-chain/SDK/tree/main/Prediction-V2-main](https://github.com/jelly-chain/SDK/tree/main/Prediction-V2-main)
**Jelly Claude (agent runner):** [github.com/jelly-chain/jelly-claude](https://github.com/jelly-chain/jelly-claude)

---

## What is this?

World Cup Jelly SDK is a standalone TypeScript SDK that plugs into [Jelly Claude](https://github.com/jelly-chain/jelly-claude) to give it real-time FIFA World Cup intelligence. It is designed for AI agents and quantitative workflows that need reliable, normalized World Cup data so they can reason accurately about World Cup markets on [Polymarket](https://polymarket.com) and [Kalshi](https://kalshi.com) — the same platforms supported by the [Prediction SDK v2](https://github.com/jelly-chain/SDK/tree/main/Prediction-V2-main).

Instead of asking Claude to guess about group standings or team form from memory, this SDK provides structured, evidence-backed context that Claude can use to write accurate, confident answers — including confidence scores, risk flags, narrative tags, and a clear disclaimer separating model output from raw facts.

It mirrors the architecture pattern of [Prediction-V2-main](https://github.com/jelly-chain/SDK/tree/main/Prediction-V2-main) but is scoped entirely to football and FIFA national-team tournaments. It does not handle club football (Premier League, La Liga, etc.), DEX trading, or blockchain events.

---

## Goals

- Provide a single normalized interface for World Cup fixtures, standings, squads, bracket state, and historical data.
- Help agents answer football-event questions with structured context instead of raw text.
- Map football data into prediction-market objects and features for Polymarket and Kalshi.
- Support historical analysis, pre-match forecasting, and live-event monitoring.
- Stay narrow: FIFA World Cup and adjacent national-team tournament intelligence only.

## Non-goals

- Not a general sports SDK — no club football, no other sports.
- Not a full betting or execution engine.
- Not an unofficial trading bot by default.
- Not a replacement for licensed official FIFA feeds where rights are restricted.
- Not a dependency of Prediction-V2-main — it runs independently alongside it.

---

## Quick Start

```ts
import { WorldCupJellySDK } from "world-cup-jelly-sdk";

const sdk = new WorldCupJellySDK({
  providers: {
    footballApi: { apiKey: process.env.FOOTBALL_API_KEY },
    polymarket:  { enabled: true },
    kalshi:      { enabled: true, keyId: process.env.KALSHI_KEY_ID }
  },
  cache: { type: "memory", ttlSeconds: 120 },
  agent: { format: "claude-json" }
});

// Answer a full natural-language prediction market question
const context = await sdk.agents.getPredictionContext({
  question: "Will Brazil win Group G?",
  platform: "POLYMARKET"
});

console.log(context.signals.confidence);   // e.g. 0.72
console.log(context.signals.riskFlags);    // e.g. ["multiple-absences"]
console.log(context.explanation);          // Human-readable reasoning
```

---

## Installing into Jelly Claude

[Jelly Claude](https://github.com/jelly-chain/jelly-claude) is a multi-chain AI agent runner powered by Claude Code. It supports Solana, BNB, Polygon, Polymarket, Kalshi and more. Clone all repos into the same parent folder so they sit alongside each other.

```bash
# 1. Clone jelly-claude and the SDK repo
git clone https://github.com/jelly-chain/jelly-claude
git clone https://github.com/jelly-chain/SDK

# Your directory layout:
# ~/jelly/
#   jelly-claude/           ← agent runner
#   SDK/
#     FIFA-SDK/             ← this SDK
#     Prediction-V2-main/   ← general prediction SDK

# 2. Run the jelly-claude setup wizard (one time only)
cd jelly-claude
bash setup.sh

# 3. Add your FIFA data provider key to .env
echo "FOOTBALL_API_KEY=your_key_here" >> .env

# 4. Launch the agent
bash jelly-claude.sh

# Or launch in TORQ mode (token-optimised, best free models)
bash torq.sh
```

Inside a Claude Code session, the `skills/world-cup/SKILL.md` file inside this SDK automatically teaches Claude how to call all available tools. The SDK's `ToolAdapter` exposes Claude function-calling definitions that Claude reads and registers automatically — no extra wiring needed beyond having the folder present alongside jelly-claude.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need.

| Variable | Required | Purpose |
|---|---|---|
| `FOOTBALL_API_KEY` | Recommended | Live fixture, standings, and squad data from [api-football.com](https://api-football.com) |
| `KALSHI_KEY_ID` | Optional | Kalshi prediction market reads (authenticated endpoint) |
| `KALSHI_PRIVATE_KEY` | Optional | Kalshi market reads (RSA private key) |
| `NEWS_API_KEY` | Optional | Squad news and injury updates |
| `WEATHER_API_KEY` | Optional | Venue weather forecasts for match context enrichment |
| `CACHE_TTL_SECONDS` | Optional | Override default cache TTL (default: 120) |

---

## Architecture

The SDK is organized into six top-level namespaces, each exposed on the `WorldCupJellySDK` class. Every call flows through a layered pipeline: providers fetch raw data → normalizers clean it → the intelligence and prediction layers derive signals → the agents layer formats everything for Claude.

```
User question
     │
     ▼
MarketQuestionParser          ← parse NL question to MarketType + entity IDs
     │
     ▼
FifaNamespace                 ← fetch fixtures, standings, squads, bracket
     │
     ▼
IntelligenceNamespace         ← form, matchup, injuries, qualification paths
     │
     ▼
PredictionNamespace           ← features → confidence → scenarios → explanation
     │
     ▼
AgentRuntime                  ← assemble AgentPredictionContext
     │
     ▼
ToolAdapter / ClaudeFormat    ← Claude function-calling response
```

| Namespace | Purpose |
|---|---|
| `sdk.fifa` | Raw World Cup data — fixtures, teams, groups, standings, squads, players, venues, bracket, events, history |
| `sdk.intelligence` | Derived signals — form, matchup, injuries, squad strength, tiebreak simulation, qualification paths, upset detection, narrative tagging |
| `sdk.prediction` | Market reasoning — feature building, question parsing, resolution mapping, confidence scoring, scenario generation, probability calibration, explanation building |
| `sdk.markets` | Market integration — read-only Polymarket and Kalshi clients, normalization, mapping, resolution utilities |
| `sdk.agents` | Agent interface — Claude/Jelly-compatible tool calls, evidence bundles, prompt context, Claude-format output |
| `sdk.backtesting` | Historical analysis — backtest runner, historical loader, Brier score/log-loss scoring, report generation |

---

## Full Directory Structure

```
world-cup-jelly-sdk/
├── package.json                         # name: world-cup-jelly-sdk, v0.1.0, ESM
├── tsconfig.json                        # ESNext, strict, bundler moduleResolution
├── vitest.config.ts                     # Vitest unit test configuration
├── .env.example                         # Required and optional env vars
├── .gitignore
├── LICENSE                              # MIT
├── README.md                            # This file
│
├── src/
│   ├── index.ts                         # Public entry point — re-exports all modules
│   ├── sdk.ts                           # WorldCupJellySDK class — wires all namespaces
│   ├── types.ts                         # All shared TypeScript interfaces and types
│   ├── errors.ts                        # SDK error hierarchy (WorldCupSDKError → subtypes)
│   ├── logger.ts                        # Structured singleton logger with log levels
│   ├── config.ts                        # SDKConfig — applies defaults, validates input
│   │
│   ├── fifa/                            # Raw World Cup data layer
│   │   ├── fixtures.ts                  # Fixture schedules and results
│   │   ├── teams.ts                     # Team profiles and lookup
│   │   ├── groups.ts                    # Group structure and membership
│   │   ├── standings.ts                 # Live group standings
│   │   ├── squads.ts                    # Team rosters and availability
│   │   ├── players.ts                   # Player profiles and stats
│   │   ├── venues.ts                    # Stadium data
│   │   ├── bracket.ts                   # Knockout bracket state
│   │   ├── events.ts                    # Match events (goals, cards, substitutions)
│   │   └── history.ts                   # Historical World Cups, H2H records
│   │
│   ├── intelligence/                    # Derived signal layer
│   │   ├── form-engine.ts               # Recent form rating (W/D/L window, 0–1 score)
│   │   ├── matchup-engine.ts            # Head-to-head matchup context, favored team
│   │   ├── injury-impact.ts             # Unavailability impact scoring and risk flags
│   │   ├── squad-strength.ts            # Availability + FIFA ranking composite score
│   │   ├── schedule-pressure.ts         # Rest days, short-turnaround flags
│   │   ├── tiebreak-simulator.ts        # FIFA group tiebreak rules engine (pts → GD → GF → H2H)
│   │   ├── qualification-path.ts        # Stage advancement probability, elimination risk
│   │   ├── upset-detector.ts            # Fixture upset probability from ranking gap + form
│   │   └── narrative-engine.ts          # Must-win, form-contrast, elimination-pressure tags
│   │
│   ├── prediction/                      # Market reasoning layer
│   │   ├── feature-builder.ts           # Normalized feature vectors per market question
│   │   ├── market-question-parser.ts    # NL question → MarketType + team IDs + group code
│   │   ├── resolution-mapper.ts         # MarketType → FIFA tournament resolution criteria
│   │   ├── confidence-engine.ts         # 0–1 confidence score from feature vector
│   │   ├── scenario-generator.ts        # Win/draw/loss probability scenarios
│   │   ├── probability-calibrator.ts    # Platt scaling + overround removal
│   │   └── explanation-builder.ts       # Human-readable reasoning + model disclaimer
│   │
│   ├── providers/                       # External data provider layer
│   │   ├── base-provider.ts             # BaseProvider interface + AbstractProvider
│   │   ├── provider-manager.ts          # Provider lifecycle, health checks
│   │   ├── fifa-platform/
│   │   │   ├── client.ts                # Official FIFA data stub (requires licensing)
│   │   │   ├── adapter.ts               # FIFA API response → SDK types
│   │   │   └── types.ts                 # Raw FIFA API response shapes
│   │   ├── football-api/
│   │   │   ├── client.ts                # api-football.com v3 HTTP client
│   │   │   ├── adapter.ts               # api-football response → SDK types
│   │   │   └── types.ts                 # Raw api-football v3 response shapes
│   │   ├── news/
│   │   │   ├── client.ts                # News/injury update provider
│   │   │   └── adapter.ts               # News article normalization
│   │   └── weather/
│   │       ├── client.ts                # Venue weather provider
│   │       └── adapter.ts               # Weather data normalization
│   │
│   ├── normalizers/                     # Cross-provider data normalization
│   │   ├── fixture-normalizer.ts        # Any source → Fixture (normalizes stage + status)
│   │   ├── team-normalizer.ts           # Any source → Team (builds deterministic team-{slug} ID)
│   │   ├── player-normalizer.ts         # Any source → Player (position map, availability)
│   │   ├── standing-normalizer.ts       # Any source → GroupStanding
│   │   ├── event-normalizer.ts          # Any source → MatchEvent (goal/card/sub type map)
│   │   ├── odds-normalizer.ts           # Decimal/American/Fractional → probability
│   │   └── market-normalizer.ts         # Polymarket/Kalshi raw → NormalizedMarket
│   │
│   ├── markets/                         # Prediction market integration (read-only)
│   │   ├── polymarket/
│   │   │   ├── client.ts                # Polymarket CLOB public API client
│   │   │   ├── market-reader.ts         # Live price snapshots and implied probability
│   │   │   ├── mapper.ts                # Polymarket market → SDK World Cup entities
│   │   │   └── types.ts                 # Raw Polymarket CLOB API types
│   │   ├── kalshi/
│   │   │   ├── client.ts                # Kalshi REST API client (key + private key auth)
│   │   │   ├── market-reader.ts         # Live Kalshi yes/no price snapshots
│   │   │   ├── mapper.ts                # Kalshi ticker → SDK market type + entities
│   │   │   └── types.ts                 # Raw Kalshi API types
│   │   └── common/
│   │       ├── market-types.ts          # MarketCommon — cross-platform comparison utilities
│   │       ├── market-question.ts       # Market question description helpers
│   │       └── market-resolution.ts     # Resolution condition definitions + isResolved()
│   │
│   ├── agents/                          # Agent-facing interface layer
│   │   ├── agent-runtime.ts             # AgentRuntime — getPredictionContext, getMatchContext, buildEvidenceBundle
│   │   ├── tool-adapter.ts              # ToolAdapter — Claude function-calling tool definitions + dispatch
│   │   ├── claude-format.ts             # Claude tool result formatter and contradiction flags
│   │   ├── prompt-context.ts            # System prompt section and evidence summary builders
│   │   └── response-schema.ts           # AgentPredictionContext validator + fallback generator
│   │
│   ├── cache/
│   │   ├── memory-cache.ts              # In-memory TTL cache with expiry (default)
│   │   ├── redis-cache.ts               # Redis cache stub (optional, multi-process)
│   │   └── cache-keys.ts                # All deterministic cache key builders
│   │
│   ├── schemas/                         # Runtime schema validators and example generators
│   │   ├── fixture.schema.ts
│   │   ├── team.schema.ts
│   │   ├── player.schema.ts
│   │   ├── standing.schema.ts
│   │   ├── market.schema.ts
│   │   ├── prediction-context.schema.ts
│   │   └── agent-response.schema.ts
│   │
│   ├── backtesting/
│   │   ├── backtest-runner.ts           # Historical World Cup backtest engine
│   │   ├── historical-loader.ts         # Register and load fixture/standing snapshots
│   │   ├── scoring.ts                   # Brier score, log loss, calibration error, accuracy
│   │   └── report.ts                    # Report generation with markdown export
│   │
│   ├── replay/
│   │   ├── replay-engine.ts             # Frame-by-frame match replay from event sequence
│   │   ├── timeline-builder.ts          # Human-readable match event timeline
│   │   └── event-reconstructor.ts       # Full match state reconstruction at any minute
│   │
│   └── utils/
│       ├── dates.ts                     # Kickoff parsing, rest-day calculations, isMatchLive()
│       ├── math.ts                      # clamp, average, weightedAverage, sigmoid, roundTo
│       ├── strings.ts                   # slugify, normalizeTeamName, buildTeamId/PlayerId/FixtureId
│       ├── ids.ts                       # Ids.* — deterministic entity ID builders
│       └── async.ts                     # withTimeout, retry, sleep, allSettledMap
│
├── examples/
│   ├── basic-fixtures/                  # List fixtures + Group A standings
│   │   ├── index.ts
│   │   └── README.md
│   ├── group-winner-agent/              # Answer "Will France win Group B?" on Polymarket
│   │   ├── index.ts
│   │   └── README.md
│   ├── match-winner-context/            # Build full match context for a fixture ID
│   │   ├── index.ts
│   │   └── README.md
│   ├── polymarket-market-map/           # Parse + map a Polymarket question
│   │   ├── index.ts
│   │   └── README.md
│   ├── kalshi-event-map/                # Read + map a Kalshi market ticker
│   │   ├── index.ts
│   │   └── README.md
│   └── claude-agent-tooling/            # Full Claude tool call simulation
│       ├── index.ts
│       └── README.md
│
├── docs/
│   ├── getting-started.md               # Installation and first SDK call
│   ├── providers.md                     # Provider configuration reference
│   ├── data-model.md                    # All entity types with field descriptions
│   ├── market-mapping.md                # How NL questions map to resolution criteria
│   ├── agent-integration.md             # How to wire into jelly-claude
│   ├── backtesting.md                   # Running historical backtests
│   ├── caching.md                       # Cache type, TTL configuration, key reference
│   ├── compliance.md                    # Data licensing and prediction disclaimers
│   └── roadmap.md                       # Planned features by version
│
├── tests/
│   ├── sdk.test.ts                      # WorldCupJellySDK init, namespace presence, basic calls
│   ├── prediction-parser.test.ts        # MarketQuestionParser — all market types, team extraction
│   ├── confidence-engine.test.ts        # ConfidenceEngine — scoring, tiers, uncertainty notes
│   └── cache.test.ts                    # MemoryCache — TTL, set/get/delete/clear
│
└── skills/
    └── world-cup/
        └── SKILL.md                     # Jelly Claude agent skill — installation + tool usage guide
```

---

## Top-Level Namespaces — Full Reference

### `sdk.fifa` — World Cup Data

| Method | Returns | Description |
|---|---|---|
| `fixtures.list(filters)` | `Fixture[]` | List fixtures — filter by `stage`, `groupCode`, `team`, `status` |
| `fixtures.byId(id)` | `Fixture` | Fetch a single fixture by normalized ID (e.g. `wc26-match-048`) |
| `fixtures.recentResults(teamId, limit?)` | `Fixture[]` | Most recent finished matches for a team, newest first |
| `fixtures.upcoming(teamId)` | `Fixture[]` | Scheduled fixtures for a team |
| `teams.list()` | `Team[]` | All teams participating in the tournament |
| `teams.byId(id)` | `Team` | Team by normalized ID (e.g. `team-argentina`) |
| `teams.byName(name)` | `Team \| undefined` | Fuzzy-match a team by common name |
| `groups.list()` | `Group[]` | All groups with member teams |
| `groups.byCode(code)` | `Group \| undefined` | Single group (e.g. `'B'`) |
| `standings.group(code)` | `GroupStanding[]` | Sorted standings for a group |
| `standings.all()` | `Record<GroupCode, GroupStanding[]>` | All groups' standings |
| `standings.forTeam(id)` | `GroupStanding \| undefined` | A team's current standing |
| `squads.byTeam(id)` | `Player[]` | Full squad roster for a team |
| `squads.available(id)` | `Player[]` | Non-injured, non-suspended players |
| `squads.unavailable(id)` | `Player[]` | Players who cannot play |
| `players.byId(id)` | `Player` | Player profile |
| `players.byName(name, teamId?)` | `Player \| undefined` | Fuzzy player lookup |
| `players.topScorers(limit?)` | `Player[]` | Tournament top scorers |
| `venues.list()` | `Venue[]` | All tournament venues |
| `venues.byId(id)` | `Venue` | Venue by ID |
| `bracket.current()` | `BracketNode[]` | Full knockout bracket state |
| `bracket.byRound(round)` | `BracketNode[]` | Nodes for a specific knockout round |
| `bracket.isEliminated(teamId)` | `boolean` | Whether a team has been knocked out |
| `events.byMatch(id)` | `MatchEvent[]` | All events in a match |
| `events.goals(matchId)` | `MatchEvent[]` | Goals and own goals only |
| `events.redCards(matchId)` | `MatchEvent[]` | Red cards only |
| `history.worldCup(year)` | `HistoricalWorldCup \| undefined` | Historical World Cup summary |
| `history.headToHead(teamA, teamB)` | `HeadToHead` | H2H record in World Cup matches |
| `history.titleCounts()` | `Record<string, number>` | Wins per nation across all World Cups |

### `sdk.intelligence` — Derived Signals

| Method | Returns | Description |
|---|---|---|
| `form.team(teamId, window?)` | `FormRecord` | Recent form: W/D/L results, goals, 0–1 form rating |
| `matchup.compare({ homeTeam, awayTeam, tournament? })` | `MatchupContext` | Full matchup: form, H2H, favored team, narrative tags |
| `injuries.summary(teamId)` | `InjurySummary` | Unavailable players, impact score, key absences |
| `squadStrength.evaluate(teamId)` | `SquadStrengthReport` | Rating, availability ratio, depth score, strength tier |
| `schedulePressure.evaluate(teamId, fixtureId?)` | `SchedulePressureReport` | Rest days, short-turnaround and travel flags |
| `tiebreak.simulate(groupCode, assumptions?)` | `TiebreakResult` | Final group standings using FIFA tiebreak rules (pts → GD → GF → H2H) |
| `qualification.path(teamId)` | `QualificationPathReport` | Points needed, qualification probability, elimination risk |
| `upsets.evaluate(fixtureId)` | `UpsetRisk \| undefined` | Upset probability, contributing factors, risk level |
| `narratives.forMatch(fixtureId)` | `MatchNarrative` | Tags: must-win, form-contrast, elimination-pressure, group-decider |

### `sdk.prediction` — Market Reasoning

| Method | Returns | Description |
|---|---|---|
| `parser.parse(question)` | `ParsedMarketQuestion` | Extract `MarketType`, team IDs, group code, confidence from NL question |
| `features.build({ marketType, fixtureId?, teamIds? })` | `PredictionFeatures` | Normalized feature vector for confidence scoring |
| `confidence.score(features)` | `ConfidenceResult` | 0–1 score, tier (very-high/high/medium/low/uncertain), factors, uncertainty notes |
| `scenarios.forFixture(fixtureId)` | `Scenario[]` | Win/draw/loss probability scenarios with implications |
| `calibrator.calibrate(raw, alpha?, beta?)` | `number` | Platt scaling — sigmoid calibration of raw probability |
| `calibrator.removeOverround(odds[])` | `NormalizedOdds[]` | Remove bookmaker overround so probabilities sum to 1 |
| `calibrator.normalize(probabilities[])` | `number[]` | Normalize array so values sum to 1 |
| `resolution.map({ marketType, teamId? })` | `ResolutionCriteria` | FIFA resolution condition and description for a market type |
| `explanation.build(features, confidence, favored?)` | `PredictionExplanation` | Key factors, counter-factors, data quality note, model disclaimer |

### `sdk.markets` — Market Integration

| Method | Returns | Description |
|---|---|---|
| `polymarket.search(query)` | `PolymarketMarket[]` | Search Polymarket markets by keyword |
| `polymarket.market(conditionId)` | `PolymarketMarket \| null` | Fetch a specific Polymarket market |
| `polymarket.find({ query })` | `PolymarketMarket \| null` | Best-match market for a NL question |
| `kalshi.search(query)` | `KalshiMarket[]` | Search Kalshi markets |
| `kalshi.market(ticker)` | `KalshiMarket \| null` | Fetch a Kalshi market by ticker |
| `common.resolveQuestion(question)` | `{ platform, confidence }` | Detect best market platform for a question |
| `common.compareMarketOdds({ polymarketId?, kalshiTicker? })` | `object` | Cross-platform implied probability comparison |

### `sdk.agents` — Agent Interface

| Method | Returns | Description |
|---|---|---|
| `getPredictionContext({ question, platform })` | `AgentPredictionContext` | Full structured context for any World Cup market question |
| `getMatchContext({ fixtureId, platform? })` | `object` | Match context: fixture, matchup analysis, narrative |
| `getGroupContext({ groupCode, platform? })` | `object` | Group context: group info, current standings |
| `buildClaudeToolResponse(input)` | `object` | Wrapped Claude-format tool result with version metadata |
| `buildEvidenceBundle({ teamIds, fixtureId? })` | `object` | Compact evidence bundle (form + injuries + qualification) for agent reasoning |

### `sdk.backtesting` — Historical Analysis

| Method | Returns | Description |
|---|---|---|
| `run({ tournamentYear, marketType, strategy? })` | `BacktestResult` | Backtest accuracy against a historical World Cup |
| `compareYears(years[], marketType)` | `BacktestResult[]` | Compare performance across multiple tournament years |

---

## Agent Tools (Claude Function Calling)

Register tools with Claude's function-calling system and dispatch calls through `ToolAdapter`:

```ts
import { ToolAdapter, ClaudeFormat } from "world-cup-jelly-sdk";

const tools   = new ToolAdapter(sdk.agents);
const format  = new ClaudeFormat();

// Get definitions to pass in the `tools` field of your Claude API call
const defs = tools.getToolDefinitions();

// Handle a tool call returned by Claude
const result = await tools.execute({
  name: "resolve_market_question",
  parameters: {
    question: "Will England win Group C?",
    platform: "POLYMARKET"
  }
});

if (result.success) {
  const output = format.formatPredictionContext(result.data);
  // Return output.content as the tool_result content block
}
```

| Tool Name | Description |
|---|---|
| `resolve_market_question` | Parse any World Cup question and return a full `AgentPredictionContext` |
| `get_fixture_context` | Full match context: form, H2H, narrative, matchup analysis |
| `get_group_table` | Current group standings for a group letter A–L |
| `explain_world_cup_prediction` | Full confidence + evidence + explanation for a question |

---

## Prediction Context Output Shape

Every call to `sdk.agents.getPredictionContext()` returns an `AgentPredictionContext`:

```ts
{
  question:        "Will Argentina win Group A?",
  marketPlatform:  "POLYMARKET",
  marketType:      "GROUP_WINNER",
  entities: {
    teams:      ["team-argentina"],
    tournament: "fifa-wc-2026"
  },
  evidence: {
    standings: [ /* GroupStanding[] for the group */ ],
    form:      [ /* FormRecord[] per team */ ],
    squadNews: [ /* injury/suspension notes */ ]
  },
  signals: {
    favorite:      "team-argentina",
    confidence:    0.75,            // 0 = uncertain, 1 = very confident
    riskFlags:     ["multiple-absences"],
    narrativeTags: ["group-decider", "must-win"]
  },
  explanation:  "Argentina is strong favorites based on form and ranking. Key absences noted.",
  generatedAt:  "2026-06-15T14:30:00.000Z"
}
```

**Agent guidance:**
- Cite `evidence.*` fields for facts; cite `signals.*` for model-generated estimates.
- Surface `signals.confidence` so users know certainty level.
- Use `signals.riskFlags` to communicate data gaps or injury concerns.
- Always include the `modelDisclaimer` from `explanation.build()` when presenting predictions to end users.

---

## Supported Market Types

| Market Type | Resolves When |
|---|---|
| `MATCH_WINNER` | Team wins the specific match (not draw) |
| `GROUP_WINNER` | Team finishes 1st in their group |
| `QUALIFICATION` | Team finishes top 2 in group |
| `REACH_R16` | Team reaches Round of 16 |
| `REACH_QF` | Team reaches Quarterfinal |
| `REACH_SF` | Team reaches Semifinal |
| `REACH_FINAL` | Team reaches the Final |
| `TOURNAMENT_WINNER` | Team wins FIFA World Cup 2026 |
| `TOP_SCORER` | Player wins the Golden Boot |

---

## Data Model — ID Conventions

All entity IDs are deterministic slugs so they stay consistent across providers and sessions:

| Entity | Format | Example |
|---|---|---|
| Tournament | `fifa-wc-{year}` | `fifa-wc-2026` |
| Group | `wc{yy}-group-{code}` | `wc26-group-b` |
| Fixture | `wc{yy}-match-{nnn}` | `wc26-match-048` |
| Team | `team-{slug}` | `team-argentina` |
| Player | `player-{slug}` | `player-kylian-mbappe` |
| Venue | `venue-{slug}` | `venue-sofi-stadium` |

Use `Ids.*` from `src/utils/ids.ts` to build IDs programmatically:

```ts
import { Ids } from "world-cup-jelly-sdk";

Ids.team("Brazil")             // "team-brazil"
Ids.player("Kylian Mbappé")   // "player-kylian-mbappe"
Ids.fixture(2026, 48)          // "wc26-match-048"
```

---

## Backtesting

```ts
// Run a backtest against a historical World Cup
const result = await sdk.backtesting.run({
  tournamentYear: 2022,
  marketType:     "MATCH_WINNER"
});

console.log(`Accuracy:           ${(result.accuracy * 100).toFixed(1)}%`);
console.log(`Avg Confidence:     ${(result.averageConfidence * 100).toFixed(1)}%`);
console.log(`Calibration Error:  ${result.calibrationError.toFixed(3)}`);

// Compare performance across years
const results = await sdk.backtesting.compareYears([2018, 2022], "GROUP_WINNER");
```

**Scoring metrics:**

| Metric | Description | Better when |
|---|---|---|
| Brier Score | Mean squared error between predicted probability and outcome | Lower |
| Log Loss | Logarithmic loss — penalizes overconfident wrong predictions | Lower |
| Calibration Error (ECE) | Mean absolute gap between predicted probability and actual win rate | Lower |
| Accuracy | Fraction where `round(probability) === outcome` | Higher |

---

## Caching

All expensive queries are cached automatically. Default is in-memory with a 120-second TTL.

```ts
// Memory cache (default — single process)
const sdk = new WorldCupJellySDK({
  cache: { type: "memory", ttlSeconds: 120 }
});

// Redis cache (optional — multi-process or long-running deployments)
const sdk = new WorldCupJellySDK({
  cache: { type: "redis", redisUrl: process.env.REDIS_URL, ttlSeconds: 300 }
});
```

**Recommended TTL by data type:**

| Data | Recommended TTL |
|---|---|
| Fixtures (scheduled) | 300s |
| Live match events | 30s |
| Group standings | 120s |
| Squad / injury news | 600s |
| Market prices | 60s |

---

## Relation to Prediction-V2-main

[Prediction-V2-main](https://github.com/jelly-chain/SDK/tree/main/Prediction-V2-main) is a general-purpose multi-chain prediction SDK covering BNB Chain, Ethereum, Polymarket, Kalshi, and on-chain event triggers. World Cup Jelly SDK is a **domain-specific add-on** — they run independently side-by-side in jelly-claude.

| | Prediction-V2-main | World Cup Jelly SDK |
|---|---|---|
| Domain | Multi-chain DeFi + markets | FIFA World Cup only |
| Data sources | On-chain events, TVL, token launches, APIs | Fixtures, standings, squads, bracket, history |
| Market platforms | Polymarket, Kalshi, predict.fun | Polymarket, Kalshi |
| Agent output type | `PredictionResult` | `AgentPredictionContext` |
| Backtesting | On-chain event replay | Historical World Cup scenarios |
| Football knowledge | None | Full — fixtures, form, tiebreaks, narratives |

---

## Compliance

- Respect provider licensing and redistribution limits for all configured data sources.
- `football-api` uses api-football.com — review their terms of service for commercial use.
- `fifa-platform` assumes you hold an appropriate data agreement with FIFA for official feeds.
- Polymarket public market data is freely accessible for read-only research under their terms.
- Kalshi requires an account and API credentials — read their usage policy before integrating.
- Do not present model-generated `signals` as certainty. Always surface `signals.confidence` and the `modelDisclaimer` from `ExplanationBuilder`.
- Market reading and prediction generation are separated from any execution logic by design. Do not automate orders without separate compliance review.
- Keep `evidence.*` (facts from providers) clearly separated from `signals.*` (model estimates) in all agent outputs.

---

## Roadmap

| Version | Focus |
|---|---|
| **v0.1 (current)** | Full typed SDK structure, all module stubs wired, agent tools, memory cache, backtesting scaffold, 4 unit test suites |
| **v0.2** | Live api-football.com HTTP calls, live Polymarket CLOB reads, H2H history data (2018/2022), squad news via news provider |
| **v0.3** | Live Kalshi reads, backtest results against 2018/2022 data, calibration reports, venue weather enrichment |
| **v1.0** | Production-ready providers, Redis cache, Monte Carlo scenario simulation, price-vs-model contradiction alerts, full test coverage, npm publish as `world-cup-jelly-sdk` |
| **v1.1** | Live match event monitoring, real-time standing updates during group stage, knockout path alerts, replay engine for match debugging |

---

## Installation

```bash
npm install world-cup-jelly-sdk
```

Or import directly from source alongside jelly-claude (no build step required):

```ts
import { WorldCupJellySDK } from "../SDK/FIFA-SDK/src/index.js";
```

## License

MIT — see [LICENSE](./LICENSE)
