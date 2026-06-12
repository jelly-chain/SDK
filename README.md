# SDK-MAIN — JellyOS / JellyClaude Intelligence Layer

> **42 Production SDKs · 508 Planned · Agent-first prediction & trading infrastructure.**

![SDKs](https://img.shields.io/badge/SDKs-41%20Production%20%2F%20509%20Planned-blue)
![Commits](https://img.shields.io/badge/Commits-137-green)
![Vulnerabilities](https://img.shields.io/badge/Vulnerabilities-0-brightgreen)

This repository contains the complete SDK ecosystem for JellyOS and JellyClaude — AI agent systems that generate predictions, detect arbitrage, and make data-driven decisions across prediction markets (Polymarket, Kalshi), sports betting, and DeFi.

---

## Table of Contents

- [Repository Map](#repository-map)
- [Core SDKs (Existing)](#core-sdks-existing)
  - [FIFA-SDK](#fifa-sdk)
  - [SPORT-SDK](#sport-sdk)
  - [Prediction-V2-main](#prediction-v2-main)
  - [market-prediction-sdk-main](#market-prediction-sdk-main)
- [Data Provider SDKs](#data-provider-sdks)
  - [sportradar-sdk](#sportradar-sdk)
  - [espn-live-sdk](#espn-live-sdk)
  - [weather-venue-sdk](#weather-venue-sdk)
- [Prediction Market SDKs](#prediction-market-sdks)
  - [polymarket-clob-sdk](#polymarket-clob-sdk)
  - [kalshi-v3-sdk](#kalshi-v3-sdk)
  - [metaculus-sdk](#metaculus-sdk)
  - [manifold-sdk](#manifold-sdk)
  - [betfair-exchange-sdk](#betfair-exchange-sdk)
  - [political-prediction-sdk](#political-prediction-sdk)
  - [prediction-protocol-sdk](#prediction-protocol-sdk)
- [Sport-Specific SDKs](#sport-specific-sdks)
  - [esports-sdk](#esports-sdk)
  - [cricket-sdk](#cricket-sdk)
- [Signal & Analytics SDKs](#signal--analytics-sdks)
  - [line-movement-sdk](#line-movement-sdk)
  - [social-sentiment-sdk](#social-sentiment-sdk)
  - [events-intelligence-sdk](#events-intelligence-sdk)
- [Shared Packages](#shared-packages)
  - [packages/shared-types](#packagesshared-types)
- [Quick Start](#quick-start)
- [Priority Order](#priority-order)

---

## Repository Map

```
SDK-main/
│
├── 🏆 CORE SDKs (4)
│   ├── FIFA-SDK/                    World Cup football intelligence
│   ├── SPORT-SDK/                   Multi-sport (NBA, NFL, Tennis, etc.)
│   ├── Prediction-V2-main/         Crypto/DeFi market prediction
│   └── market-prediction-sdk-main/  V1 prediction (deprecated → V2)
│
├── 📊 DATA PROVIDERS (3)
│   ├── sportradar-sdk/              Tier 1 sports data (80+ sports)
│   ├── espn-live-sdk/               Free fallback sports scores
│   └── weather-venue-sdk/           Weather impact on outdoor sports
│
├── 🎯 PREDICTION MARKETS (7)
│   ├── polymarket-clob-sdk/         Polymarket orderbook & arbitrage
│   ├── kalshi-v3-sdk/               Kalshi exchange V3 API
│   ├── metaculus-sdk/               Crowd forecasting (superforecasters)
│   ├── manifold-sdk/                Play-money prediction sandbox
│   ├── betfair-exchange-sdk/        Betting exchange odds
│   ├── political-prediction-sdk/    PredictIt elections & politics
│   └── prediction-protocol-sdk/     Gnosis/Augur settlement layer
│
├── 🎮 SPORT-SPECIFIC (2)
│   ├── esports-sdk/                 LoL, CS2, Dota 2, Valorant
│   └── cricket-sdk/                 IPL, ICC, Big Bash
│
├── 📈 SIGNAL & ANALYTICS (3)
│   ├── line-movement-sdk/           Historical odds tracking
│   ├── social-sentiment-sdk/        Twitter/Reddit signal extraction
│   └── events-intelligence-sdk/     Eventbrite/Ticketmaster triggers
│
└── 📦 SHARED PACKAGES (1)
    └── packages/
        └── shared-types/            Cross-SDK TypeScript types
```

---

## Core SDKs (Existing)

### FIFA-SDK

**Purpose:** FIFA World Cup data, structured football context, and prediction-market decision support for national team tournaments.

**Status:** ✅ Production-ready

**Architecture:**
```
FIFA-SDK/
├── src/
│   ├── agents/                    Agent integration layer
│   │   ├── agent-runtime.ts       Agent execution engine
│   │   ├── claude-format.ts       Claude-compatible output formatting
│   │   ├── prompt-context.ts      Context injection for prompts
│   │   ├── response-schema.ts     Response validation schemas
│   │   └── tool-adapter.ts        Tool definition adapter for agents
│   │
│   ├── backtesting/               Historical prediction evaluation
│   │   ├── backtest-runner.ts     Run backtests on historical data
│   │   ├── historical-loader.ts   Load historical match data
│   │   ├── report.ts              Generate backtest reports
│   │   └── scoring.ts             Brier score, log loss, calibration
│   │
│   ├── cache/                     Caching layer
│   │   ├── cache-keys.ts          Cache key generation utilities
│   │   ├── memory-cache.ts        In-memory cache with TTL
│   │   └── redis-cache.ts         Redis-backed distributed cache
│   │
│   ├── competitions/              🆕 Tournament modules
│   │   ├── club-world-cup.ts      Club World Cup 2025 (32 teams)
│   │   └── womens-world-cup.ts    Women's World Cup data layer
│   │
│   ├── fifa/                      Core FIFA data modules
│   │   ├── bracket.ts             Knockout bracket management
│   │   ├── events.ts              Match events (goals, cards, subs)
│   │   ├── fixtures.ts            Fixture listing and filtering
│   │   ├── groups.ts              Group stage management
│   │   ├── history.ts             Historical match data
│   │   ├── players.ts             Player profiles and stats
│   │   ├── squads.ts              Squad composition and availability
│   │   ├── standings.ts           Group standings and tiebreakers
│   │   ├── teams.ts               Team profiles and rankings
│   │   └── venues.ts              Venue information and conditions
│   │
│   ├── i18n/                      🆕 Internationalization
│   │   ├── localization.ts        Multi-language response generation
│   │   └── translations.ts        Football term translations (24 languages)
│   │
│   ├── intelligence/              🆕 Analysis engines
│   │   ├── elo-ratings.ts         Historical Elo rating system
│   │   ├── form-engine.ts         Team form calculation
│   │   ├── injury-impact.ts       Injury impact scoring
│   │   ├── matchup-engine.ts      Head-to-head matchup analysis
│   │   ├── narrative-engine.ts    Narrative-driven context tags
│   │   ├── qualification-path.ts  Qualification pathway calculator
│   │   ├── qualification-simulator.ts 🆕 Full confederation qualifier modeling
│   │   ├── schedule-pressure.ts   Schedule congestion analysis
│   │   ├── set-piece-analytics.ts 🆕 Corner/free kick conversion rates
│   │   ├── squad-strength.ts      Squad depth and quality scoring
│   │   ├── tiebreak-simulator.ts  Tiebreak scenario modeling
│   │   ├── transfer-impact.ts     🆕 Transfer window impact on odds
│   │   ├── upset-detector.ts      Upset risk identification
│   │   └── var-tracker.ts         🆕 VAR decision tracking
│   │
│   ├── markets/                   Prediction market integrations
│   │   ├── common/                Shared market utilities
│   │   │   ├── market-question.ts Market question parsing
│   │   │   ├── market-resolution.ts Resolution mapping
│   │   │   └── market-types.ts    Market type definitions
│   │   ├── kalshi/                Kalshi market integration
│   │   │   ├── client.ts          Kalshi API client
│   │   │   ├── mapper.ts          Market data mapper
│   │   │   ├── market-reader.ts   Market reading utilities
│   │   │   └── types.ts           Kalshi type definitions
│   │   └── polymarket/            Polymarket integration
│   │       ├── client.ts          Polymarket API client
│   │       ├── mapper.ts          Market data mapper
│   │       ├── market-reader.ts   Market reading utilities
│   │       └── types.ts           Polymarket type definitions
│   │
│   ├── normalizers/               Data normalization layer
│   │   ├── event-normalizer.ts    Normalize match events
│   │   ├── fixture-normalizer.ts  Normalize fixtures across providers
│   │   ├── market-normalizer.ts   Normalize market data
│   │   ├── odds-normalizer.ts     Normalize odds formats
│   │   ├── player-normalizer.ts   Normalize player data
│   │   ├── standing-normalizer.ts Normalize standings
│   │   └── team-normalizer.ts     Normalize team data
│   │
│   ├── prediction/                Prediction engine
│   │   ├── confidence-engine.ts   Confidence score calculation
│   │   ├── explanation-builder.ts Human-readable explanations
│   │   ├── feature-builder.ts     Feature extraction for models
│   │   ├── market-question-parser.ts Natural language question parsing
│   │   ├── probability-calibrator.ts Probability calibration
│   │   ├── resolution-mapper.ts   Map predictions to market outcomes
│   │   └── scenario-generator.ts  What-if scenario generation
│   │
│   ├── providers/                 Data provider integrations
│   │   ├── base-provider.ts       Abstract provider base class
│   │   ├── provider-manager.ts    Multi-provider failover
│   │   ├── fifa-platform/         Official FIFA data
│   │   │   ├── adapter.ts         Response adapter
│   │   │   ├── client.ts          API client
│   │   │   └── types.ts           Response types
│   │   ├── football-api/          Football-API.org data
│   │   │   ├── adapter.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── news/                  News feed integration
│   │   │   ├── adapter.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── referee/               🆕 Referee assignment data
│   │   │   ├── adapter.ts         Referee data normalization
│   │   │   ├── client.ts          Referee API client
│   │   │   └── types.ts           Referee type definitions
│   │   └── weather/               🆕 Weather data (real API)
│   │       ├── adapter.ts         Weather data normalization
│   │       ├── client.ts          OpenWeatherMap integration
│   │       └── types.ts           Weather type definitions
│   │
│   ├── replay/                    Match replay/reconstruction
│   │   ├── event-reconstructor.ts Reconstruct match events
│   │   ├── replay-engine.ts       Replay execution engine
│   │   └── timeline-builder.ts    Timeline visualization data
│   │
│   ├── schemas/                   Validation schemas
│   │   ├── agent-response.schema.ts
│   │   ├── fixture.schema.ts
│   │   ├── market.schema.ts
│   │   ├── player.schema.ts
│   │   ├── prediction-context.schema.ts
│   │   ├── standing.schema.ts
│   │   └── team.schema.ts
│   │
│   └── utils/                     Shared utilities
│       ├── async.ts               Async helpers (retry, timeout)
│       ├── dates.ts               Date parsing and formatting
│       ├── ids.ts                 ID generation utilities
│       ├── math.ts                Math helpers (sigmoid, average)
│       └── strings.ts             String utilities (slugify, etc.)
│
├── docs/                          Documentation
│   ├── agent-integration.md       How to integrate with agents
│   ├── backtesting.md             Backtesting guide
│   ├── caching.md                 Caching strategies
│   ├── compliance.md              Legal compliance notes
│   ├── data-model.md              Data model documentation
│   ├── getting-started.md         Quick start guide
│   ├── market-mapping.md          Market mapping reference
│   ├── providers.md               Provider documentation
│   └── roadmap.md                 Development roadmap
│
├── examples/                      Usage examples
│   ├── basic-fixtures/            Fetch basic fixture data
│   ├── claude-agent-tooling/      Claude agent integration
│   ├── group-winner-agent/        Group winner prediction agent
│   ├── kalshi-event-map/          Kalshi market mapping
│   ├── match-winner-context/      Match winner context builder
│   └── polymarket-market-map/     Polymarket market mapping
│
├── skills/                        Agent skills
│   └── world-cup/
│       └── SKILL.md               World Cup prediction skill
│
└── tests/                         Test suite
    ├── cache.test.ts
    ├── confidence-engine.test.ts
    ├── prediction-parser.test.ts
    └── sdk.test.ts
```

---

### SPORT-SDK

**Purpose:** Multi-sport intelligence for NBA, NFL, Football (EPL, La Liga, UCL, etc.), Tennis, MLB, NHL, MMA, F1, Cricket, and Esports.

**Status:** ✅ Production-ready

**Architecture:**
```
SPORT-SDK/
├── src/
│   ├── agents/                    Agent integration layer
│   │   ├── agent-runtime.ts       Agent execution engine
│   │   ├── claude-format.ts       Claude output formatting
│   │   ├── prompt-context.ts      Context injection
│   │   ├── response-schema.ts     Response validation
│   │   └── tool-adapter.ts        Tool definitions
│   │
│   ├── backtesting/               Historical evaluation
│   │   ├── backtest-runner.ts     Run backtests
│   │   ├── historical-loader.ts   Load historical data
│   │   ├── report.ts              Generate reports
│   │   └── scoring.ts             Scoring metrics
│   │
│   ├── bankroll/                  🆕 Bankroll management
│   │   └── kelly.ts               Kelly criterion stake sizing
│   │
│   ├── cache/                     Caching layer
│   │   ├── cache-keys.ts          Cache key utilities
│   │   └── memory-cache.ts        In-memory cache
│   │
│   ├── intelligence/              🆕 Analysis engines
│   │   ├── line-movement.ts       🆕 Line movement tracking
│   │   ├── narrative-engine.ts    Narrative context tags
│   │   ├── rest-advantage.ts      🆕 Rest day advantage calculation
│   │   ├── social-sentiment.ts    🆕 Social media sentiment
│   │   └── travel-fatigue.ts      🆕 Travel fatigue calculator
│   │
│   ├── live/                      Live event monitoring
│   │   └── alert-engine.ts        Real-time alert system
│   │
│   ├── markets/                   Prediction market integrations
│   │   ├── common/                Shared utilities
│   │   │   └── market-types.ts    Market type definitions
│   │   ├── kalshi/                Kalshi integration
│   │   │   ├── client.ts          Kalshi API client
│   │   │   ├── mapper.ts          Data mapper
│   │   │   ├── reader.ts          Market reader
│   │   │   └── types.ts           Type definitions
│   │   └── polymarket/            Polymarket integration
│   │       ├── client.ts          Polymarket API client
│   │       ├── mapper.ts          Data mapper
│   │       ├── reader.ts          Market reader
│   │       └── types.ts           Type definitions
│   │
│   ├── normalizers/               Data normalization
│   │   ├── event-normalizer.ts
│   │   ├── fixture-normalizer.ts
│   │   ├── market-normalizer.ts
│   │   ├── odds-normalizer.ts
│   │   ├── player-normalizer.ts
│   │   ├── standing-normalizer.ts
│   │   └── team-normalizer.ts
│   │
│   ├── prediction/                Prediction engine
│   │   ├── confidence-engine.ts   Confidence scoring
│   │   ├── explanation-builder.ts Explanation generation
│   │   ├── feature-builder.ts     Feature extraction
│   │   ├── market-question-parser.ts Question parsing
│   │   ├── parlay-calculator.ts   🆕 Multi-leg bet math
│   │   ├── player-props.ts        🆕 Player prop market engine
│   │   └── probability-calibrator.ts Probability calibration
│   │
│   ├── providers/                 Data provider integrations
│   │   ├── base-provider.ts       Abstract base class
│   │   ├── provider-manager.ts    Multi-provider failover
│   │   ├── api-sports/            API-Sports integration
│   │   │   ├── adapter.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── balldontlie/           Ball Don't Lie (NBA/NFL/MLB)
│   │   │   ├── adapter.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── football-data/         Football-Data.org
│   │   │   ├── adapter.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── sportmonks/            Sportmonks (Football)
│   │   │   ├── adapter.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── the-odds-api/          The Odds API
│   │   │   ├── adapter.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   └── thesportsdb/           TheSportsDB
│   │       ├── adapter.ts
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── ratings/                   Team/player ratings
│   │   └── elo-ratings.ts         Elo rating system
│   │
│   ├── replay/                    Match replay
│   │   ├── event-reconstructor.ts
│   │   ├── replay-engine.ts
│   │   └── timeline-builder.ts
│   │
│   ├── research/                  Pre-match research
│   │   └── session.ts             Research session management
│   │
│   ├── schemas/                   Validation schemas
│   │   ├── fixture.schema.ts
│   │   ├── player.schema.ts
│   │   ├── prediction-context.schema.ts
│   │   ├── standing.schema.ts
│   │   └── team.schema.ts
│   │
│   ├── sports/                    🆕 Sport-specific modules
│   │   ├── bracket.ts             Bracket management
│   │   ├── cricket.ts             🆕 Cricket (IPL, ICC, Big Bash)
│   │   ├── esports.ts             🆕 Esports (LoL, CS2, Dota 2, Valorant)
│   │   ├── events.ts              Match events
│   │   ├── fixtures.ts            Fixture management
│   │   ├── history.ts             Historical data
│   │   ├── leagues.ts             League catalog (16+ leagues)
│   │   ├── players.ts             Player management
│   │   ├── results.ts             Results tracking
│   │   ├── standings.ts           Standings management
│   │   ├── teams.ts               Team management
│   │   ├── tennis-surfaces.ts     🆕 Surface specialization (clay/hard/grass)
│   │   ├── ufc.ts                 🆕 UFC/MMA fight card data
│   │   └── venues.ts              Venue management
│   │
│   └── utils/                     Shared utilities
│       ├── async.ts
│       ├── dates.ts
│       ├── ids.ts
│       ├── math.ts
│       └── strings.ts
│
├── docs/                          Documentation
│   ├── agent-integration.md
│   ├── backtesting.md
│   ├── caching.md
│   ├── compliance.md
│   ├── data-model.md
│   ├── getting-started.md
│   ├── market-mapping.md
│   ├── providers.md
│   └── roadmap.md
│
├── examples/                      Usage examples
│   ├── basic-fixtures/
│   ├── claude-agent-tooling/
│   ├── league-table/
│   ├── match-context/
│   ├── nba-context/
│   └── polymarket-odds/
│
├── skills/                        Agent skills
│   ├── bankroll-management/       Kelly criterion, fixed units, portfolio risk
│   │   └── calculators/
│   ├── base/                      Base skill template
│   ├── data-fetching/             Data provider failover
│   │   └── patterns/
│   ├── live-events/               Live event monitoring
│   │   └── triggers/
│   ├── market-arbitrage/          Cross-platform arbitrage
│   │   └── strategies/
│   ├── model-evaluation/          Model scoring and validation
│   │   └── methodologies/
│   ├── research/                  Pre-match research
│   │   └── workflows/
│   ├── sports/                    Multi-sport prediction skill
│   └── sports-prediction/         Sports prediction workflows
│       └── workflows/
│
└── tests/                         Test suite
    ├── cache.test.ts
    ├── confidence-engine.test.ts
    ├── prediction-parser.test.ts
    └── sdk.test.ts
```

---

### Prediction-V2-main

**Purpose:** Crypto/DeFi market prediction with on-chain data, prediction market integration (Polymarket, Kalshi, predict.fun), and production-grade automation.

**Status:** ✅ Production-ready (V2 of market-prediction-sdk)

**Architecture:**
```
Prediction-V2-main/
├── src/
│   ├── agents/                    Agent integration
│   │   ├── index.ts
│   │   └── ...                    Tool adapters, formatters
│   │
│   ├── anomaly-detection/         Anomaly detection
│   │   └── ...                    Statistical anomaly detection
│   │
│   ├── audit/                     Audit trail
│   │   └── ...                    Decision audit logging
│   │
│   ├── chains/                    Multi-chain support
│   │   ├── evm/                   EVM chain adapters
│   │   └── index.ts               Chain registry
│   │
│   ├── checkpoints/               State checkpointing
│   │   └── ...                    Save/restore execution state
│   │
│   ├── constants/                 Shared constants
│   │   ├── chains.ts              Chain definitions
│   │   ├── events.ts              Event type definitions
│   │   ├── index.ts               Constants barrel export
│   │   └── keywords.ts            Bullish/bearish keywords
│   │
│   ├── deduplication/             Signal deduplication
│   │   └── ...                    Prevent duplicate signals
│   │
│   ├── errors/                    Error hierarchy
│   │   ├── base-error.ts          Base error class
│   │   ├── index.ts               Error exports
│   │   └── ...                    Specialized errors
│   │
│   ├── explanations/              Explanation generation
│   │   └── ...                    Human-readable reasoning
│   │
│   ├── features/                  Feature flags
│   │   ├── backtesting/           Backtesting feature
│   │   ├── portfolio-impact/      Portfolio impact analysis
│   │   └── simulation/            Simulation mode
│   │
│   ├── hooks/                     Lifecycle hooks
│   │   └── ...                    Pre/post prediction hooks
│   │
│   ├── jobs/                      Background jobs
│   │   └── ...                    Scheduled prediction jobs
│   │
│   ├── migrations/                Data migrations
│   │   └── ...                    Schema migrations
│   │
│   ├── models/                    Internal models
│   │   └── index.ts               Model exports
│   │
│   ├── normalizers/               Data normalization
│   │   └── ...                    Normalize provider data
│   │
│   ├── permissions/               Permission system
│   │   └── ...                    Access control
│   │
│   ├── pipeline/                  Prediction pipeline
│   │   └── ...                    Ingestion → Trigger → Score → Output
│   │
│   ├── plugin-runtime/            Plugin execution
│   │   └── ...                    Plugin lifecycle management
│   │
│   ├── plugins/                   Plugin system
│   │   ├── builtins/              Built-in plugins
│   │   └── index.ts               Plugin registry
│   │
│   ├── policies/                  Policy engine
│   │   └── ...                    Risk policies, compliance
│   │
│   ├── prediction/                🆕 Prediction engines (10 new modules)
│   │   ├── bridge-flow.ts         🆕 Cross-chain bridge flow monitor
│   │   ├── confidence-engine.ts   Confidence scoring
│   │   ├── correlation-analyzer.ts Cross-asset correlation
│   │   ├── ensemble-model.ts      Multi-strategy aggregation
│   │   ├── funding-rate.ts        🆕 Funding rate arbitrage detector
│   │   ├── governance-scorer.ts   🆕 DAO governance impact scoring
│   │   ├── keyword-matcher.ts     Keyword trigger detection
│   │   ├── liquidity-analyzer.ts  Liquidity depth analysis
│   │   ├── market-regime-detector.ts Market regime identification
│   │   ├── mev-monitor.ts         🆕 MEV activity monitoring
│   │   ├── news-classifier.ts     🆕 News event classification
│   │   ├── orderbook-depth.ts     🆕 Orderbook depth analysis
│   │   ├── outcome-classifier.ts  Outcome classification
│   │   ├── price-predictor.ts     Price movement prediction
│   │   ├── risk-assessor.ts       Risk evaluation
│   │   ├── sentiment-analyzer.ts  Sentiment scoring
│   │   ├── signal-generator.ts    Signal creation
│   │   ├── social-volume.ts       🆕 Social volume spike detection
│   │   ├── stablecoin-flow.ts     🆕 Stablecoin flow analysis
│   │   ├── token-unlock.ts        🆕 Token unlock schedule impact
│   │   ├── trend-detector.ts      Trend identification
│   │   ├── volatility-estimator.ts Volatility estimation
│   │   ├── volume-analyzer.ts     Volume-based signals
│   │   └── whale-tracker.ts       🆕 Whale wallet tracking
│   │
│   ├── projections/               Future projections
│   │   └── ...                    Forward-looking estimates
│   │
│   ├── providers/                 Data providers
│   │   ├── base-provider.ts       Abstract base
│   │   ├── index.ts               Provider exports
│   │   ├── llamafi/               DeFiLlama integration
│   │   ├── mcp/                   MCP protocol integration
│   │   ├── offchain/              Off-chain data sources
│   │   ├── onchain/               On-chain data sources
│   │   └── provider-manager.ts    Multi-provider failover
│   │
│   ├── queues/                    Job queues
│   │   └── ...                    Async job processing
│   │
│   ├── registry/                  Component registry
│   │   └── ...                    Register strategies, triggers, etc.
│   │
│   ├── replay/                    Execution replay
│   │   └── ...                    Replay past predictions
│   │
│   ├── retries/                   Retry logic
│   │   └── ...                    Exponential backoff, jitter
│   │
│   ├── router/                    Output routing
│   │   └── ...                    Route predictions to destinations
│   │
│   ├── schemas/                   Validation schemas
│   │   └── ...                    Input/output validation
│   │
│   ├── scoring/                   Scoring engine
│   │   └── ...                    Signal scoring and ranking
│   │
│   ├── security/                  Security layer
│   │   └── ...                    API key management, rate limiting
│   │
│   ├── storage/                   Storage adapters
│   │   └── ...                    File, Redis, database storage
│   │
│   ├── strategies/                Prediction strategies
│   │   └── ...                    Pluggable strategy system
│   │
│   ├── telemetry/                 Observability
│   │   └── ...                    Metrics, tracing, logging
│   │
│   ├── triggers/                  Trigger system
│   │   └── ...                    Keyword, condition, time triggers
│   │
│   ├── utils/                     Shared utilities
│   │   ├── async.ts               Async helpers
│   │   ├── dates.ts               Date utilities
│   │   ├── hashes.ts              Hashing utilities
│   │   ├── math.ts                Math helpers
│   │   └── strings.ts             String utilities
│   │
│   ├── versioning/                Version management
│   │   └── ...                    Strategy versioning
│   │
│   ├── windowing/                 Time windowing
│   │   └── ...                    Sliding/tumbling windows
│   │
│   ├── config.ts                  Runtime configuration
│   ├── data-fetcher.ts            Data fetching orchestration
│   ├── events.ts                  Event detection
│   ├── index.ts                   Public entry point
│   ├── logger.ts                  Structured logging
│   ├── metrics.ts                 Performance metrics
│   ├── predictor.ts               Main prediction orchestrator
│   ├── types.ts                   Shared TypeScript types
│   └── validators.ts              Input validation
│
├── benchmarks/                    Performance benchmarks
├── docs/                          Documentation
├── examples/                      Usage examples
│   ├── basic-prediction/
│   ├── keyword-trigger-bot/
│   ├── multi-chain-monitor/
│   ├── plugin-strategy/
│   └── replay-debugger/
│
├── scripts/                       Build/deploy scripts
├── skills/                        Agent skills
│   └── market-prediction/
│       ├── examples/
│       ├── presets/
│       ├── prompts/
│       ├── tools/
│       └── SKILL.md
│
├── templates/                     Project templates
│   ├── starter-agent/
│   ├── starter-backtest/
│   ├── starter-basic/
│   └── starter-plugin/
│
└── tests/                         Test suite
    ├── contracts/                 Contract tests
    ├── fixtures/                  Test fixtures
    ├── helpers/                   Test helpers
    ├── integration/               Integration tests
    └── unit/                      Unit tests
```

---

### market-prediction-sdk-main

**Purpose:** ⚠️ **DEPRECATED** — V1 of market prediction SDK. Superseded by Prediction-V2-main.

**Status:** ⚠️ Deprecated — use Prediction-V2-main instead.

**Architecture:**
```
market-prediction-sdk-main/
├── src/
│   ├── constants/                 🆕 Shared constants (extractable)
│   │   ├── chains.ts              Chain definitions
│   │   ├── events.ts              Event type definitions
│   │   ├── index.ts               Constants barrel export
│   │   ├── keywords.ts            Market keywords
│   │   └── thresholds.ts          Confidence/risk thresholds
│   │
│   ├── data-sources/              Data source integrations
│   │   └── ...                    LlamaFi, BNB Chain MCP
│   │
│   ├── errors/                    🆕 Standardized error handling
│   │   ├── base-error.ts          V2-compatible error classes
│   │   └── index.ts               Error exports
│   │
│   ├── prediction/                Prediction modules
│   │   ├── ensemble-model.ts      Multi-model aggregation
│   │   ├── keyword-matcher.ts     Keyword trigger detection
│   │   ├── price-predictor.ts     Price prediction
│   │   ├── risk-assessor.ts       Risk evaluation
│   │   ├── sentiment-analyzer.ts  Sentiment analysis
│   │   ├── signal-generator.ts    Signal creation
│   │   ├── trend-detector.ts      Trend detection
│   │   └── volume-analyzer.ts     Volume analysis
│   │
│   ├── telemetry/                 🆕 OpenTelemetry integration
│   │   ├── index.ts               Telemetry exports
│   │   └── tracing.ts             Tracing, metrics, counters
│   │
│   ├── config.ts                  Configuration
│   ├── data-fetcher.ts            Data fetching
│   ├── events.ts                  Event detection
│   ├── index.ts                   Public entry point
│   ├── logger.ts                  Logging
│   ├── predictor.ts               Main orchestrator
│   └── types.ts                   Type definitions
│
├── .github/
│   └── workflows/                 🆕 CI/CD pipelines
│       ├── ci.yml                 Test/lint/build pipeline
│       └── publish.yml            npm publish pipeline
│
├── scripts/                       🆕 Automation scripts
│   └── changelog-automation.ts    Auto-generate changelogs
│
├── skills/                        Agent skills
│   └── market-prediction/
│       └── SKILL.md
│
├── tests/                         Test suite (30+ tests)
│
├── CHANGELOG.md                   🆕 Version history
├── DEPRECATION.md                 🆕 Migration guide to V2
├── Dockerfile                     🆕 Docker build
└── docker-compose.yml             🆕 Docker compose config
```

---

## Data Provider SDKs

### sportradar-sdk

**Purpose:** Tier 1 sports data provider — real-time scores, play-by-play, player tracking, injury reports across 80+ sports. This is what Polymarket and Kalshi use for settlement data.

**Status:** ✅ New

**Architecture:**
```
sportradar-sdk/
├── src/
│   ├── sports/                    Sport-specific modules
│   │   ├── index.ts               Sports barrel export
│   │   ├── football.ts            Football (EPL, La Liga, UCL, World Cup)
│   │   └── basketball.ts          Basketball (NBA, EuroLeague)
│   │
│   ├── adapter.ts                 Data normalization to JellyOS format
│   ├── client.ts                  Sportradar API client
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- 80+ sports coverage
- Live scores with sub-second latency
- Play-by-play data
- Injury reports
- Lineup data
- Player statistics
- Standings and schedules

---

### espn-live-sdk

**Purpose:** Free, no-API-key sports data fallback — real-time scores, standings, schedules across NFL, NBA, MLB, NHL, MLS, EPL, UCL.

**Status:** ✅ New

**Architecture:**
```
espn-live-sdk/
├── src/
│   ├── client.ts                  ESPN public API client
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- No API key required
- Free and unlimited
- Covers all major US sports + international football
- Real-time scores
- Standings and schedules
- Team rosters

---

### weather-venue-sdk

**Purpose:** Weather impact analysis for outdoor sports venues — temperature, wind, precipitation, altitude effects on match outcomes.

**Status:** ✅ New

**Architecture:**
```
weather-venue-sdk/
├── src/
│   ├── client.ts                  Weather API client (OpenWeatherMap)
│   ├── impact.ts                  Weather impact analyzer
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Venue weather forecasting
- Impact severity assessment
- Playing style recommendations
- Set piece impact analysis
- Fatigue risk scoring
- Betting angle generation
- Dome/retractable roof detection

---

## Prediction Market SDKs

### polymarket-clob-sdk

**Purpose:** Deep Polymarket CLOB integration — full orderbook depth, trade history, resolution data, and cross-platform arbitrage detection.

**Status:** ✅ New

**Architecture:**
```
polymarket-clob-sdk/
├── src/
│   ├── arbitrage.ts               Cross-platform arbitrage detection
│   ├── client.ts                  Polymarket CLOB API client
│   ├── index.ts                   Public entry point
│   ├── orderbook.ts               Orderbook depth analysis
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Full orderbook depth (bids + asks)
- Trade history access
- Spread and liquidity analysis
- Wall detection (large orders)
- Slippage estimation
- Cross-platform arbitrage detection
- Multi-leg arbitrage (market must sum to ~1)

---

### kalshi-v3-sdk

**Purpose:** Full Kalshi V3 exchange API — events, markets, orderbook, order placement, portfolio management. CFTC-regulated with unique markets (weather, economics, politics).

**Status:** ✅ New

**Architecture:**
```
kalshi-v3-sdk/
├── src/
│   ├── client.ts                  Kalshi V3 API client
│   ├── index.ts                   Public entry point
│   ├── portfolio.ts               Portfolio management & Kelly sizing
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Event and market browsing
- Orderbook data
- Order placement and cancellation
- Portfolio tracking
- Kelly criterion stake sizing
- Sports market filtering
- Politics market filtering
- RSA signature authentication (V3)

---

### metaculus-sdk

**Purpose:** Crowd forecasting platform integration — superforecasters, calibration data, and non-sports predictions (science, tech, geopolitics).

**Status:** ✅ New

**Architecture:**
```
metaculus-sdk/
├── src/
│   ├── analyzer.ts                Forecast analysis and calibration
│   ├── client.ts                  Metaculus API client
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Access to superforecaster predictions
- Community prediction aggregation
- Calibration assessment (Brier score)
- Prediction market comparison
- High-conviction signal detection
- Question search and filtering

---

### manifold-sdk

**Purpose:** Play-money prediction market — backtesting sandbox and model calibration platform with zero financial risk.

**Status:** ✅ New

**Architecture:**
```
manifold-sdk/
├── src/
│   ├── calibration.ts             Calibration analysis
│   ├── client.ts                  Manifold API client
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Play-money market access
- Calibration data calculation
- Brier score computation
- Overconfident prediction detection
- Multi-source prediction comparison
- Market search and filtering
- Bet placement (play money)

---

### betfair-exchange-sdk

**Purpose:** World's largest betting exchange — real orderbook data, not just bookmaker odds. Exchange odds are sharper than bookmaker odds.

**Status:** ✅ New

**Architecture:**
```
betfair-exchange-sdk/
├── src/
│   ├── client.ts                  Betfair Exchange API client
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Real orderbook data (back + lay)
- Exchange-implied probabilities
- Market depth visualization
- Price summary per runner
- Sports event filtering
- Exchange edge calculation
- App key authentication

---

### political-prediction-sdk

**Purpose:** Political prediction market intelligence — PredictIt data, election forecasts, policy impact analysis.

**Status:** ✅ New

**Architecture:**
```
political-prediction-sdk/
├── src/
│   ├── client.ts                  PredictIt API client
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- PredictIt market access
- Presidential/Senate/House market filtering
- Market vs polling comparison
- Outcome pricing
- Volume and liquidity data
- Election forecasting

---

### prediction-protocol-sdk

**Purpose:** Prediction market protocol integration — Gnosis Conditional Tokens Framework, Augur markets, settlement mechanics, and oracle integration.

**Status:** ✅ New

**Architecture:**
```
prediction-protocol-sdk/
├── src/
│   ├── augur.ts                   Augur protocol client
│   ├── gnosis.ts                  Gnosis CTF client
│   ├── index.ts                   Public entry point
│   ├── settlement.ts              Settlement analysis
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Gnosis Conditional Tokens support
- Augur market integration
- Settlement status tracking
- Cross-protocol settlement comparison
- Payout calculation
- Dispute window monitoring
- Fee calculation

---

## Sport-Specific SDKs

### esports-sdk

**Purpose:** Esports intelligence — League of Legends, CS2, Dota 2, Valorant, Overwatch, Rocket League with prediction market integration.

**Status:** ✅ New

**Architecture:**
```
esports-sdk/
├── src/
│   ├── client.ts                  PandaScore API client
│   ├── index.ts                   Public entry point
│   ├── prediction.ts              Esport match predictor
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Multi-title support (LoL, CS2, Dota 2, Valorant)
- Team and player data
- Match schedules and live scores
- Tournament tracking
- Rating-based prediction
- Map pool analysis
- Polymarket event formatting

---

### cricket-sdk

**Purpose:** Cricket intelligence — IPL, ICC events, Big Bash, CPL, PSL with prediction market integration.

**Status:** ✅ New

**Architecture:**
```
cricket-sdk/
├── src/
│   ├── client.ts                  CricAPI client
│   ├── index.ts                   Public entry point
│   ├── prediction.ts              Cricket match predictor
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Multi-format support (T20, ODI, Test, Hundred)
- Multi-league support (IPL, Big Bash, ICC)
- Live match tracking
- Net Run Rate calculation
- Toss impact assessment
- Pitch condition analysis
- Weather integration

---

## Signal & Analytics SDKs

### line-movement-sdk

**Purpose:** Historical odds tracking and line movement analysis — store, visualize, and detect sharp money movements.

**Status:** ✅ New

**Architecture:**
```
line-movement-sdk/
├── src/
│   ├── detector.ts                Line value analysis, RLM detection
│   ├── index.ts                   Public entry point
│   ├── tracker.ts                 Line movement tracking
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Odds snapshot recording
- Line movement visualization data
- Steam move detection (rapid line changes)
- Sharp money identification
- Reverse line movement detection
- Stale line detection
- Edge calculation vs model probability

---

### social-sentiment-sdk

**Purpose:** Social media sentiment analysis — Twitter/Reddit buzz as prediction signals for sports and crypto.

**Status:** ✅ New

**Architecture:**
```
social-sentiment-sdk/
├── src/
│   ├── analyzer.ts                Sentiment analysis engine
│   ├── detector.ts                Volume spike detection
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Multi-platform support (Twitter, Reddit, Telegram, Discord)
- Keyword-based sentiment scoring
- Verified account weighting
- Bot detection and filtering
- Volume spike detection
- Drama/incident detection
- Sentiment shift detection

---

### events-intelligence-sdk

**Purpose:** Event-driven market intelligence — Eventbrite, Ticketmaster, concert/festival data for prediction triggers.

**Status:** ✅ New

**Architecture:**
```
events-intelligence-sdk/
├── src/
│   ├── analyzer.ts                Event market signal analysis
│   ├── client.ts                  Eventbrite + Ticketmaster clients
│   ├── index.ts                   Public entry point
│   └── types.ts                   Type definitions
│
└── package.json
```

**Key Features:**
- Dual-source event data (Eventbrite + Ticketmaster)
- Event search and filtering
- Market signal generation
- Sold-out event detection
- Venue capacity analysis
- Category-specific signals
- Aggregate event sentiment

---

## Shared Packages

### packages/shared-types

**Purpose:** Shared TypeScript types across all Jelly Chain SDKs — prevents type drift and ensures consistency.

**Status:** ✅ New

**Architecture:**
```
packages/shared-types/
├── src/
│   └── index.ts                   All shared types
│
├── package.json
└── tsconfig.json
```

**Exports:**
- Chain & Network types
- Time & Scheduling types
- Signal & Prediction types
- Sports types (Team, Player, Fixture, Standing)
- Prediction Market types
- Event & Alert types
- Provider types
- Cache types
- Agent types
- Utility types

---

## Quick Start

```bash
# Clone the SDK repo
git clone https://github.com/jelly-chain/SDK

# Install dependencies for any SDK
cd SDK/FIFA-SDK && npm install
cd SDK/SPORT-SDK && npm install
cd SDK/Prediction-V2-main && npm install

# Run tests
npm test

# Build
npm run build
```

---

## Priority Order

| Priority | SDK | Use Case |
|----------|-----|----------|
| 🔴 P0 | `polymarket-clob-sdk` | Deep Polymarket integration |
| 🔴 P0 | `sportradar-sdk` | Best sports data |
| 🔴 P0 | `FIFA-SDK` | World Cup 2026 |
| 🔴 P0 | `SPORT-SDK` | Multi-sport coverage |
| 🔴 P0 | `Prediction-V2-main` | Crypto market prediction |
| 🔴 P0 | `uniswap-v3-sdk` | Uniswap V3 concentrated liquidity |
| 🔴 P0 | `sportradar-sdk` | Best sports data |
| 🔴 P0 | `FIFA-SDK` | World Cup 2026 |
| 🔴 P0 | `SPORT-SDK` | Multi-sport coverage |
| 🔴 P0 | `Prediction-V2-main` | Crypto market prediction |
| 🟠 P1 | `kalshi-v3-sdk` | Second prediction market |
| 🟠 P1 | `metaculus-sdk` | Crowd forecasting |
| 🟠 P1 | `esports-sdk` | Esports markets |
| 🟡 P2 | `betfair-exchange-sdk` | Exchange odds |
| 🟡 P2 | `cricket-sdk` | Cricket markets |
| 🟡 P2 | `weather-venue-sdk` | Weather impact |
| 🟡 P2 | `line-movement-sdk` | Sharp money detection |
| 🟢 P3 | `manifold-sdk` | Backtesting sandbox |
| 🟢 P3 | `political-prediction-sdk` | Election markets |
| 🟢 P3 | `events-intelligence-sdk` | Event triggers |
| 🟢 P3 | `espn-live-sdk` | Free fallback |
| 🟢 P3 | `social-sentiment-sdk` | Social signals |
| ⚪ P4 | `prediction-protocol-sdk` | Protocol integration |

---

## Contributing

Each SDK follows the same architecture pattern:
1. `src/types.ts` — TypeScript interfaces
2. `src/client.ts` — API client
3. `src/adapter.ts` — Data normalization
4. `src/index.ts` — Public exports
5. `package.json` — Dependencies
6. `README.md` — SDK-specific docs

---

## License

MIT — Jelly Chain
