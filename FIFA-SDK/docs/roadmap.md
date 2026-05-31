# Roadmap

## v0.1.0 (current)

- 6 provider clients (BallDontLie, API-Sports, football-data.org, TheSportsDB, Sportmonks, The Odds API)
- Multi-sport types: football, basketball, american-football, tennis, baseball, ice-hockey, mma, formula1
- 4 Claude agent tools: `resolve_sports_question`, `get_match_context`, `get_league_table`, `explain_sports_prediction`
- Full intelligence layer: form, matchup, injuries, squad strength, schedule pressure, upsets, narratives
- Prediction layer: question parsing, feature building, confidence engine, scenario generation, calibration
- Polymarket + Kalshi market integration (read-only)
- In-memory TTL cache
- Backtesting engine with Brier score / log loss / calibration error
- Match replay + event reconstruction
- `skills/sports/SKILL.md` for Jelly Claude integration

## v0.2.0 (planned)

- Live provider data hydration (BallDontLie NBA live scores)
- Redis cache support (multi-process)
- F1 standings and race result integration
- Tennis grand slam bracket tracking
- Player-level prop market support
- Odds API implied probability integration into confidence engine

## v0.3.0 (planned)

- Sportradar and SportsDataIO adapters
- iSports API adapter (Asia-Pacific coverage)
- Portfolio-level market tracking (multi-sport, multi-platform)
- USD enrichment from market data
