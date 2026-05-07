# Rate-limit handling

Goal: respect provider rate limits while keeping the system responsive.

## Inputs
- Retry budget
- Backoff policy
- Rate limit headers (if available)

## Strategy
1. If HTTP 429 is received:
   - Read `Retry-After` header when present.
   - Otherwise use exponential backoff with jitter.
2. Reduce concurrency for that provider.
3. Cache results aggressively for endpoints likely to be repeated.

## Output requirements
- Return a decision object: { waitedMs, retriedCount, finalStatus }.
- Add a risk flag when the resulting data is older than the freshness SLA.
