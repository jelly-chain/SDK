# Roadmap

## v0.1 (Current)
- Full TypeScript SDK structure with typed stubs
- FIFA data layer: fixtures, teams, groups, standings, squads, players, venues, bracket, events, history
- Intelligence layer: form, matchup, injuries, narratives, tiebreaks, qualification paths
- Prediction layer: feature building, market-question parsing, confidence scoring, explanations
- Markets: Polymarket and Kalshi read-only stubs
- Agent tools: Claude/Jelly-compatible tool adapter and response formatter
- Memory cache, backtesting scaffold, replay engine

## v0.2
- Live api-football.com integration (real HTTP calls)
- Live Polymarket CLOB API integration
- Squad news via news provider
- Venue weather enrichment
- Historical World Cup fixture data (2018, 2022)

## v0.3
- Live Kalshi API integration
- Head-to-head history from real data sources
- Backtesting runner against 2018 and 2022 data
- Calibration reporting

## v1.0
- Production-ready provider adapters
- Redis cache support
- Scenario simulation with Monte Carlo
- Price-vs-model comparison alerts
- Full test coverage
- npm publish as `world-cup-jelly-sdk`

## v1.1
- Live match event monitoring
- Real-time standing updates during group stage
- Alerting hooks for qualification scenario changes
- Replay engine for live match debugging
