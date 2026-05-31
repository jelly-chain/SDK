# Agent Integration

## Jelly Claude Integration

Place `sports-jelly-sdk/` alongside your `jelly-claude/` workspace:

```
~/jelly/
  jelly-claude/
  SDK/
    SPORT-SDK/    ← this SDK
```

## Registering Tools

```ts
import { WorldSportsSDK } from '../SPORT-SDK/src/index.js';

const sdk = new WorldSportsSDK({ providers: { ... } });
const toolDefs = sdk.getToolDefinitions();
// Pass toolDefs to Claude's tools array
```

## Handling Tool Calls

```ts
const result = await sdk.tools.execute({
  name: toolCall.name as ToolName,
  parameters: toolCall.input,
});
// Return result.data as the tool_result content block
```

## Available Claude Tools

| Tool | Parameters | Returns |
|---|---|---|
| `resolve_sports_question` | `question`, `platform?` | `AgentSportsContext` |
| `get_match_context` | `fixtureId`, `platform?` | Match context object |
| `get_league_table` | `league`, `season?` | Standings + league context |
| `explain_sports_prediction` | `question` | Full Claude envelope with explanation |

## Skill File

The `skills/sports/SKILL.md` file teaches a Jelly Claude agent how to use this SDK automatically when the folder is present alongside jelly-claude.
