# Agent Integration

How to wire the World Cup Jelly SDK into a Jelly Claude agent.

## Installation in jelly-claude-main

Copy or symlink the `world-cup-jelly-sdk` folder into your agent workspace and import:

```ts
import { WorldCupJellySDK } from '../world-cup-jelly-sdk/src/index.js';
import { ToolAdapter } from '../world-cup-jelly-sdk/src/agents/tool-adapter.js';

const sdk = new WorldCupJellySDK({ providers: { footballApi: { apiKey: process.env.FOOTBALL_API_KEY } } });
const tools = new ToolAdapter(sdk.agents);
```

## Registering Tools with Claude

```ts
const toolDefs = tools.getToolDefinitions();
// Pass toolDefs as `tools` in your Claude API call
```

## Handling Tool Calls

```ts
const result = await tools.execute({
  name: toolCall.name,
  parameters: toolCall.input,
});
// Return result.data as the tool_result content
```

## Full Agent Workflow

1. Claude receives a Polymarket question.
2. Claude calls `resolve_market_question` tool.
3. SDK parses the question, fetches standings/form/squad data.
4. SDK returns structured `AgentPredictionContext`.
5. Claude writes a human-readable answer from the context.

## Tips

- Always call `getPredictionContext` before answering World Cup market questions.
- Use `confidence` and `riskFlags` to communicate uncertainty to users.
- Use `narrativeTags` to add context about team situations (must-win, injury impact, etc.).
