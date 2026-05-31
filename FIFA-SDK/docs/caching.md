# Caching

The SDK is read-heavy and cache-friendly by design. All major queries cache results automatically.

## Memory Cache (Default)

```ts
const sdk = new WorldCupJellySDK({
  cache: { type: 'memory', ttlSeconds: 120 }
});
```

Suitable for single-process agents. Data is held in memory and expires after `ttlSeconds`.

## Redis Cache (Optional)

```ts
const sdk = new WorldCupJellySDK({
  cache: { type: 'redis', redisUrl: process.env.REDIS_URL, ttlSeconds: 300 }
});
```

Suitable for multi-process or long-running deployments.

## Cache Keys

All cache keys are deterministic and namespaced. See `src/cache/cache-keys.ts` for the full list.

Example keys:
- `fixtures:list:{"stage":"group","team":"team-brazil"}`
- `standings:group:A`
- `intelligence:form:team-argentina:5`

## TTL Recommendations

| Data Type | Recommended TTL |
|---|---|
| Fixtures (scheduled) | 300s |
| Live match events | 30s |
| Group standings | 120s |
| Squad/injury news | 600s |
| Market prices | 60s |
