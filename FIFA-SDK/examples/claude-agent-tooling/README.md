# Claude Agent Tooling Example

Shows how to use the SDK as Claude function-calling tools inside a Jelly agent.

## Run

```bash
FOOTBALL_API_KEY=your_key npx tsx index.ts
```

## What it does

1. Lists all available SDK tool definitions in Claude function-calling format.
2. Simulates a tool call for `resolve_market_question`.
3. Formats the output as a Claude-compatible tool result.
