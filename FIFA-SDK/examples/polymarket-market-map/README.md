# Polymarket Market Map Example

Demonstrates parsing a Polymarket question and mapping it to World Cup entities.

## Run

```bash
FOOTBALL_API_KEY=your_key npx tsx index.ts
```

## What it does

1. Parses a natural-language question into a structured market type and team IDs.
2. Searches Polymarket for matching markets (stub — no live call).
3. Returns a full prediction context for the agent to reason from.
