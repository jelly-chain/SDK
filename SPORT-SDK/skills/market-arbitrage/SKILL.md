# Market Arbitrage — Agent Skill

This skill enables a Jelly Claude agent to detect mispricings and EV edges across two or more sports prediction platforms.

## When to Use This Skill

Use this skill when:
- The agent needs to compare implied probabilities across platforms.
- The user wants multi-leg/multi-outcome arb ideas.
- Live odds movement creates temporary arbitrage windows.

## Supported Inputs

- Market question (sport/league + proposition)
- Candidate platforms (two or more)
- Optional constraints: max legs, risk tolerance, budget

## Outputs

- Identified arbitrage structure (legs + directions)
- EV estimate and confidence/risk flags
- Execution suggestion including “wait” criteria when edge is insufficient

## Strategies

The agent should follow one of:
- `strategies/two-platform.md`
- `strategies/multi-outcome.md`
- `strategies/live-arbitrage.md`
