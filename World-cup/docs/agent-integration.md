# Agent Integration — World Cup Jelly SDK

## For Claude Code / JellyOS

### 1. Install the SDK

```bash
npm install world-cup-jelly-sdk
```

### 2. Set Environment Variable

```bash
export JELLY_API_KEY=your_key_here
```

### 3. Register Tools

```typescript
import { WorldCupJellySDK } from 'world-cup-jelly-sdk';

const sdk = new WorldCupJellySDK();
const toolDefs = sdk.agents.getToolDefinitions();

// Pass toolDefs to Claude API as `tools` parameter
```

### 4. Handle Tool Calls

```typescript
const result = await sdk.agents.execute({
  name: toolCall.name,
  parameters: toolCall.input,
});
// Return result.data as the tool_result content block
```

## Available Tools (39+)

| Tool | Purpose |
|------|---------|
| `resolve_market_question` | Parse any World Cup market question |
| `get_team_info` | Team profile |
| `get_team_roster` | Tournament squad |
| `get_team_form` | Recent form |
| `get_team_matches` | Fixture history |
| `get_player_info` | Player profile |
| `get_player_stats` | Tournament stats |
| `get_group_standings` | Group table |
| `get_all_standings` | All groups |
| `get_match_detail` | Full match |
| `get_match_events` | Goals, cards, subs |
| `get_match_lineups` | Squads + formations |
| `get_match_summary` | Everything composite |
| `get_match_odds` | Betting lines |
| `get_futures_odds` | Outright markets |
| `get_player_props` | Player props |
| `get_line_movement` | Line history |
| `compare_teams` | Head-to-head comparison |
| `search_teams` | Fuzzy team search |
| `search_players` | Player search |
| `get_live_matches` | Currently live |

## Agent Workflow

1. User asks a World Cup question
2. Claude calls the appropriate tool(s)
3. SDK fetches data from api.jellychain.fun
4. SDK returns structured context
5. Claude writes a human-readable answer
