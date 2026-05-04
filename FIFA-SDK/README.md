# World Cup Jelly SDK

Agent-first TypeScript SDK for FIFA World Cup data, structured football context, and prediction-market decision support.

World Cup Jelly SDK is a standalone toolkit for AI agents and quantitative workflows that need reliable, normalized World Cup intelligence. It combines football data ingestion, event normalization, match context building, and market-mapping utilities so an agent can reason better about World Cup-related questions on prediction platforms such as Polymarket and Kalshi.

## Goals

- Provide a single normalized interface for World Cup data.
- Help agents answer football-event questions with structured context instead of raw text.
- Map football data into prediction-market objects and features.
- Support historical analysis, pre-match forecasting, and live-event monitoring.
- Stay narrow: FIFA World Cup and adjacent national-team tournament intelligence only.

## Non-goals

- Not a general sports SDK.
- Not a full betting or execution engine.
- Not an unofficial trading bot by default.
- Not a replacement for licensed official FIFA feeds where rights are restricted.

## Quick Start

```ts
import { WorldCupJellySDK } from "world-cup-jelly-sdk";

const sdk = new WorldCupJellySDK({
  providers: {
    footballApi: { apiKey: process.env.FOOTBALL_API_KEY },
    polymarket: { enabled: true },
    kalshi: { enabled: true }
  }
});

const context = await sdk.agents.getPredictionContext({
  question: "Will Brazil win Group G?",
  platform: "POLYMARKET"
});

console.log(context);
```

## Top-level namespaces

- `sdk.fifa` — fixtures, standings, teams, squads, bracket, history
- `sdk.intelligence` — form, matchup analysis, narratives, tiebreaks
- `sdk.prediction` — feature building, market-question parsing, confidence scoring
- `sdk.markets` — Polymarket and Kalshi read-only integration
- `sdk.agents` — Claude/Jelly-compatible tool response formatting
- `sdk.backtesting` — historical World Cup scenario analysis

## Installation

```bash
npm install world-cup-jelly-sdk
```

## Compliance

- Respect provider licensing and redistribution limits.
- Keep FIFA branding and official-data assumptions conservative.
- Separate "facts from providers" from "model-generated predictions."
- Do not present model output as certainty.
- Keep market reading separate from automated execution by default.

## License

MIT
