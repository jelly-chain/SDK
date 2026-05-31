# Getting Started

## Installation

```bash
npm install  # install dependencies
```

Copy `.env.example` to `.env` and add the API key for at least one provider.

## First SDK Call

```ts
import { WorldSportsSDK } from 'sports-jelly-sdk';

const sdk = new WorldSportsSDK({
  providers: {
    ballDontLie: { apiKey: process.env.BALLDONTLIE_API_KEY },
    theOddsApi: { apiKey: process.env.ODDS_API_KEY },
  },
  cache: { ttlSeconds: 120 },
  agent: { format: 'claude-json' },
});

// Answer a prediction question
const ctx = await sdk.agents.getSportsContext({
  question: 'Will the Lakers beat the Celtics?',
  platform: 'POLYMARKET',
});

console.log(ctx.signals.confidence);   // e.g. 0.61
console.log(ctx.explanation);          // Human-readable reasoning
```

## Wiring to Jelly Claude

```ts
import { ToolAdapter } from 'sports-jelly-sdk';

const tools = sdk.tools; // already constructed
const defs = tools.getToolDefinitions(); // pass to Claude
const result = await tools.execute({ name: toolCall.name, parameters: toolCall.input });
```
