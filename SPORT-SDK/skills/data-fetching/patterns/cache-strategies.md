# Cache strategies

Goal: reduce API calls while maintaining correctness.

## Cache layers
- In-memory short TTL for bursty requests.
- Persistent or shared cache (if SDK supports it) for longer TTL.

## Freshness
- Freshness window by data type (e.g., odds: 30–120s, injuries: hours, standings: daily).

## Key design
- Use provider id + endpoint + normalized query params.

## Invalidation
- Explicit TTL expiration.
- Optional “stale-while-revalidate”: serve stale data while refreshing in background.
