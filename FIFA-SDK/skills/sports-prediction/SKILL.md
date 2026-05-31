# Sports Prediction — Agent Skill

This skill enables a Jelly Claude agent to analyze sports prediction questions with structured, evidence-backed context across pre-match, live, and season-long workflows.

## When to Use This Skill

Use this skill when:
- A user asks about match outcomes, playoff results, championship winners, or league standings.
- The agent needs to compare model probability vs market-implied probability across platforms.
- The agent needs form data, injury summaries, matchup analysis, or odds context.
- The agent needs to track confidence and risk flags over time (pre-match → live → season-long).

## Supported Inputs

- A sports prediction question (fixture-based or market-based)
- Optional user constraints (risk tolerance, time horizon, markets/platforms)
- Optional season/league selection

## Outputs

- `signals` describing confidence, risk flags, and narrative tags
- `evidence` with factual inputs (form, injuries, standings, odds context)
- A human-readable explanation and a model disclaimer

## Workflows

- Pre-match analysis (fixture + priors)
- Live-betting updates (event changes + price moves)
- Season-long view (trend + strength estimates)

## Available Workflows

The agent should follow one of:
- `workflows/pre-match-analysis.md`
- `workflows/live-betting.md`
- `workflows/season-long.md`
