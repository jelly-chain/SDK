# Caching

## Default: In-Memory Cache

By default, sports-jelly-sdk uses a `MemoryCache` with a 120-second TTL.

```ts
const sdk = new WorldSportsSDK({
  cache: { type: 'memory', ttlSeconds: 120 },
});
```

## Cache Keys

All cache keys are deterministic. Key builders live in `src/cache/cache-keys.ts`:

```ts
CacheKeys.fixture('my-fixture-id')          // "fixture:my-fixture-id"
CacheKeys.standings('premier-league')        // "standings:premier-league:current"
CacheKeys.h2h('team-a', 'team-b', 'football') // "h2h:team-a:team-b:football"
```

## Overriding TTL

```ts
const sdk = new WorldSportsSDK({
  cache: { ttlSeconds: 60 },
});
// or via env:
// CACHE_TTL_SECONDS=60
```

## Redis (v0.1 stub)

`RedisCache` is included as a typed stub for future multi-process support. In v0.1 it falls back to in-process mode with a warning.
