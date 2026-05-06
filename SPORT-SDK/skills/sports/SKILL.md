# Sports Jelly SDK — Agent Skill

This skill enables a Jelly Claude agent to answer multi-sport prediction questions with structured, evidence-backed context pulled from sports-jelly-sdk.

## When to Use This Skill

Use this skill when:
- A user asks about match outcomes, playoff results, championship winners, or league standings.
- The agent receives a Polymarket or Kalshi question related to NBA, NFL, Football, Tennis, MLB, NHL, MMA, or F1.
- The agent needs form data, injury summaries, matchup analysis, or odds context to answer a sports question.
- The agent needs to compare model probability vs market-implied probability across platforms.

## Supported Sports

| Sport | Leagues / Events |
|---|---|
| Football | EPL, La Liga, Bundesliga, Serie A, Ligue 1, UCL, UEL, MLS, FIFA World Cup |
| Basketball | NBA |
| American Football | NFL |
| Tennis | Grand Slams (Wimbledon, US Open, French Open, Australian Open), ATP, WTA |
| Baseball | MLB |
| Ice Hockey | NHL |
| MMA | UFC |
| Formula 1 | F1 |

## Installation

Copy or symlink `sports-jelly-sdk/` alongside your agent workspace:

```ts
import { WorldSportsSDK } from '../sports-jelly-sdk/src/index.js';

const sdk = new WorldSportsSDK({
  providers: {
    ballDontLie: { apiKey: process.env.BALLDONTLIE_API_KEY },
    theOddsApi: { apiKey: process.env.ODDS_API_KEY },
  },
});

const tools = sdk.tools;
const defs = tools.getToolDefinitions();
```

## Required Environment Variables

```
BALLDONTLIE_API_KEY=   # NBA, NFL, MLB, NHL — best free multi-sport API
ODDS_API_KEY=          # The Odds API — NFL, NBA, Soccer, Tennis, MLB, NHL
SPORTS_API_KEY=        # API-Sports — Football, Basketball (optional)
FOOTBALL_DATA_API_KEY= # football-data.org — EPL, UCL, etc. (optional)
```

## Available Tools

Register these with Claude function calling via `tools.getToolDefinitions()`:

| Tool | Purpose |
|---|---|
| `resolve_sports_question` | Parse any sports prediction market question and return structured context |
| `get_match_context` | Full match context: form, matchup analysis, narratives, risk flags |
| `get_league_table` | Current standings with title race, playoff bubble, relegation zone |
| `explain_sports_prediction` | Full confidence + factors + disclaimer for any prediction question |

## Handling Tool Calls

```ts
const result = await tools.execute({
  name: toolCall.name,
  parameters: toolCall.input,
});
// Return result.data as the tool_result content block
```

## Example Agent Workflow

1. User: "Will the Lakers win the NBA Finals this year on Polymarket?"
2. Claude calls `resolve_sports_question` with the question.
3. SDK returns `AgentSportsContext` with confidence, evidence, and explanation.
4. Claude writes a human-readable answer from the structured context.

## Output Shape

Every prediction context includes:
- `signals.confidence` — probability estimate (0–1)
- `signals.riskFlags` — e.g. `["injury-concern", "short-turnaround"]`
- `signals.narrativeTags` — e.g. `["form-contrast", "h2h-dominant"]`
- `evidence.standings` — current league table
- `evidence.form` — recent match form records
- `evidence.injuries` — key absent players
- `explanation` — human-readable reasoning string
- `generatedAt` — ISO timestamp

## Best Practices

- Always call `resolve_sports_question` before answering any prediction question.
- Communicate `confidence` levels clearly — never present predictions as certain.
- Use `riskFlags` to flag data gaps or injury concerns.
- Separate model-generated `signals` from factual `evidence` in your response.
- Always include the SDK's `modelDisclaimer` when surfacing predictions to end users.
- Use `get_league_table` for standings-based questions (title race, relegation).
- Use `get_match_context` when you have a specific fixture ID.
