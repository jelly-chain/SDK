# Research — Agent Skill

This skill enables a Jelly Claude agent to gather and synthesize pre-match evidence (team news, weather impacts, contextual research) to improve prediction quality.

## When to Use This Skill

Use this skill when:
- You need structured evidence for upcoming fixtures.
- Team news/injury reports may change lineups.
- Weather and travel conditions may affect performance.
- You want uncertainty-aware summaries and risk flags.

## Supported Inputs

- Fixture/teams/league and kickoff time
- Preferred sources (optional)
- Evidence freshness constraints (optional)

## Outputs

- Structured evidence blocks
- Risk flags for missing/conflicting sources
- Synthesized recommendations for how to adjust priors

## Workflows

- `workflows/pre-match-research.md`
- `workflows/team-news.md`
- `workflows/weather-impact.md`
