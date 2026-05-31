# Match Winner Context Example

Shows how to build structured match context for a specific fixture ID.

## Run

```bash
FOOTBALL_API_KEY=your_key npx tsx index.ts
```

## What it does

1. Builds a full match context (form, h2h, narrative) for a fixture.
2. Generates win/draw/loss probability scenarios.
3. Returns all fields in Claude-compatible JSON format.
