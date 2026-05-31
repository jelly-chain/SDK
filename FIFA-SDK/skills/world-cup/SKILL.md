# World Cup Jelly SDK — Agent Skill

This skill enables a Jelly Claude agent to answer FIFA World Cup prediction questions with structured, evidence-backed context pulled from the World Cup Jelly SDK.

## When to Use This Skill

Use this skill when:
- A user asks about World Cup match outcomes, group standings, or tournament winner probabilities.
- The agent receives a Polymarket or Kalshi question related to FIFA World Cup 2026.
- The agent needs to reason about team form, squad availability, knockout implications, or tiebreak scenarios.
- The agent needs to compare model probability vs market-implied probability.

## Installation

Copy or symlink `world-cup-jelly-sdk/` alongside your agent workspace, then:

```ts
import { WorldCupJellySDK } from '../world-cup-jelly-sdk/src/index.js';
import { ToolAdapter } from '../world-cup-jelly-sdk/src/agents/tool-adapter.js';

const sdk = new WorldCupJellySDK({
  providers: { footballApi: { apiKey: process.env.FOOTBALL_API_KEY } },
});
const tools = new ToolAdapter(sdk.agents);
```

## Required Environment Variables

```
FOOTBALL_API_KEY=       # api-football.com API key for live data
KALSHI_KEY_ID=          # Optional: Kalshi market reads
KALSHI_PRIVATE_KEY=     # Optional: Kalshi market reads
```

## Available Tools

Register these with Claude function calling:

```ts
const toolDefs = tools.getToolDefinitions();
```

| Tool | Purpose |
|---|---|
| `resolve_market_question` | Parse any World Cup market question and return structured prediction context |
| `get_fixture_context` | Full match context: form, h2h, narrative, matchup analysis |
| `get_group_table` | Current group standings with team form |
| `explain_world_cup_prediction` | Full confidence + evidence + explanation for a question |

## Handling Tool Calls

```ts
const result = await tools.execute({
  name: toolCall.name,
  parameters: toolCall.input,
});
// Return result.data as the tool_result content block
```

## Example Agent Workflow

1. User: "Is England likely to win Group C on Polymarket?"
2. Claude calls `resolve_market_question` with the question.
3. SDK returns `AgentPredictionContext` with confidence, evidence, and explanation.
4. Claude writes a human-readable answer from the structured context.

## Output Shape

Every prediction context includes:
- `signals.confidence` — probability estimate (0–1)
- `signals.riskFlags` — e.g. `["elimination-risk", "injury-impact"]`
- `signals.narrativeTags` — e.g. `["must-win", "form-contrast"]`
- `evidence.standings` — current group table
- `evidence.form` — recent match results
- `explanation` — human-readable reasoning string
- `generatedAt` — ISO timestamp

## Best Practices

- Always call `resolve_market_question` before answering World Cup prediction questions.
- Communicate `confidence` level to the user — never present predictions as certain.
- Use `riskFlags` to note data gaps or uncertainty.
- Separate model-generated `signals` from factual `evidence` in your answer.
- Include the SDK's `modelDisclaimer` when surfacing predictions to end users.
