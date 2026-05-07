# Data Fetching — Agent Skill

This skill enables a Jelly Claude agent to fetch sports data reliably using provider failover, caching, and rate-limit handling.

## When to Use This Skill

Use this skill when:
- The agent needs standings, fixtures, odds, or injury feeds.
- A provider may be temporarily unavailable or rate-limited.
- Latency matters and cached data is acceptable within an SLA.

## Supported Inputs

- Provider list / preferred provider
- Cache policy (freshness window)
- Query parameters (fixture id, league, time range)

## Outputs

- Fetched payload
- Source/provider metadata (timestamp, freshness)
- Retry/failover decisions and risk flags

## Patterns

- Provider failover: `patterns/provider-failover.md`
- Cache strategies: `patterns/cache-strategies.md`
- Rate limit handling: `patterns/rate-limit-handling.md`
