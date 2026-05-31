# Providers

The SDK uses a pluggable provider system. Each provider is optional and can be enabled in the config.

## football-api (Recommended)

Uses [api-football.com](https://api-football.com) for fixtures, standings, squads, and player data.

```ts
const sdk = new WorldCupJellySDK({
  providers: {
    footballApi: { apiKey: process.env.FOOTBALL_API_KEY }
  }
});
```

The FIFA World Cup 2026 league ID on api-football.com is `1`.

## fifa-platform (Optional)

Stub for the official FIFA data platform. Requires appropriate licensing for production use.

```ts
providers: { fifa: { enabled: true } }
```

## polymarket (Default: enabled)

Reads public Polymarket markets. No authentication required.

```ts
providers: { polymarket: { enabled: true } }
```

## kalshi (Optional)

Reads Kalshi prediction markets. Requires API credentials.

```ts
providers: {
  kalshi: {
    enabled: true,
    keyId: process.env.KALSHI_KEY_ID,
    privateKey: process.env.KALSHI_PRIVATE_KEY,
  }
}
```

## news (Optional)

Fetches team news and injury updates.

```ts
providers: { news: { enabled: true, apiKey: process.env.NEWS_API_KEY } }
```

## weather (Optional)

Fetches venue weather forecasts for match context enrichment.

```ts
providers: { weather: { enabled: true, apiKey: process.env.WEATHER_API_KEY } }
```
