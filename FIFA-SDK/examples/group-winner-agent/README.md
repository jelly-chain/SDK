# Group Winner Agent Example

Shows how a Jelly Claude agent can answer "Who will win Group X?" using structured SDK context.

## Run

```bash
FOOTBALL_API_KEY=your_key npx tsx index.ts
```

## What it does

1. Fetches group standings and team form for Group B.
2. Generates a structured prediction context for a Polymarket question.
3. Returns confidence, evidence, and explanation fields ready for an agent to use.
