# Providers

## Overview

sports-jelly-sdk supports 6 live data providers plus 3 additional keys for extended coverage.

| Provider | Key Env Var | Sports Coverage | Free Tier |
|---|---|---|---|
| **BallDontLie** | `BALLDONTLIE_API_KEY` | NBA, NFL, MLB, NHL, EPL, MMA, FIFA | 5 req/min |
| **API-Sports** | `SPORTS_API_KEY` | Football, NBA, NFL, F1, Tennis, Baseball | 100 req/day |
| **football-data.org** | `FOOTBALL_DATA_API_KEY` | 12 football competitions | 10 req/min |
| **TheSportsDB** | `THESPORTSDB_PATREON_KEY` | All sports (v1 free, v2 Patreon) | v1 unlimited |
| **Sportmonks** | `SPORTMONKS_API_KEY` | Football, Cricket, F1 | Limited leagues |
| **The Odds API** | `ODDS_API_KEY` | NFL, NBA, Soccer, Tennis, MLB, NHL | 500 req/month |

## Client Architecture

Each provider has three files:
- `client.ts` — HTTP client extending `AbstractProvider`
- `adapter.ts` — Raw API types → SDK normalized types
- `types.ts` — Raw API response shapes

All providers extend `AbstractProvider` which provides `logRequest()`, `handleError()`, and `get<T>()`.

## Enabling Providers

```ts
const sdk = new WorldSportsSDK({
  providers: {
    ballDontLie: { apiKey: process.env.BALLDONTLIE_API_KEY },
    footballData: { apiKey: process.env.FOOTBALL_DATA_API_KEY },
    theOddsApi: { apiKey: process.env.ODDS_API_KEY },
  },
});
```
