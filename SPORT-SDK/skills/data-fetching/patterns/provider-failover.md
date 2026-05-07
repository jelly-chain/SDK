# Provider failover

Goal: minimize downtime by trying alternative providers in order.

## Inputs
- Provider candidates (ordered)
- Request context (query params)
- Health signals (timeouts, HTTP codes)

## Strategy
1. Attempt preferred provider.
2. On retryable failures (timeout, 429 with backoff, 5xx), mark provider degraded.
3. Switch to next provider and re-issue request.
4. Record provenance: which provider answered and why others were skipped.

## Failover rules
- Never silently mix incompatible schema payloads: map to a normalized internal format.
- If no provider succeeds, return a structured error plus “data unavailable” risk flag.
