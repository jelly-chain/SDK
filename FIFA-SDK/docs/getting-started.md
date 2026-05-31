# Getting Started

## Installation

```bash
npm install world-cup-jelly-sdk
```

## Basic Setup

```ts
import { WorldCupJellySDK } from 'world-cup-jelly-sdk';

const sdk = new WorldCupJellySDK({
  providers: {
    footballApi: { apiKey: process.env.FOOTBALL_API_KEY },
    polymarket: { enabled: true },
  },
  cache: { type: 'memory', ttlSeconds: 120 },
  agent: { format: 'claude-json' },
});
```

## Quick Example

```ts
// Ask a prediction question
const context = await sdk.agents.getPredictionContext({
  question: 'Will Brazil win Group G?',
  platform: 'POLYMARKET',
});

console.log(context.signals.confidence);  // e.g. 0.72
console.log(context.explanation);         // Human-readable reasoning
```

## Required Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `FOOTBALL_API_KEY` | Recommended | Live fixture/standings data |
| `KALSHI_KEY_ID` | Optional | Kalshi market reads |
| `KALSHI_PRIVATE_KEY` | Optional | Kalshi market reads |

## Next Steps

- See [providers.md](./providers.md) to configure data sources.
- See [agent-integration.md](./agent-integration.md) to wire into Jelly Claude.
- See [data-model.md](./data-model.md) for all entity schemas.
