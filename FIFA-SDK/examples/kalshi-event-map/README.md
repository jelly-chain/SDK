# Kalshi Event Map Example

Shows how to read Kalshi markets and map them to World Cup tournament outcomes.

## Run

```bash
FOOTBALL_API_KEY=your_key KALSHI_KEY_ID=your_key KALSHI_PRIVATE_KEY=your_key npx tsx index.ts
```

## What it does

1. Reads a Kalshi market by ticker symbol.
2. Generates prediction context for a tournament winner question on Kalshi.
3. Returns confidence and evidence fields for agent reasoning.
