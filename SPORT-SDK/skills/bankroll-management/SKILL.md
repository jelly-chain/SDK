# Bankroll Management — Agent Skill

This skill enables a Jelly Claude agent to size bets and manage portfolio exposure using bankroll-aware calculators.

## When to Use This Skill

Use this skill when:
- The agent recommends a stake for a prediction or arbitrage plan.
- The user wants risk-adjusted sizing instead of fixed stake.
- The agent must cap downside exposure across multiple concurrent bets.

## Supported Inputs

- Bankroll amount and risk tolerance
- Estimated probability (p) and payout/odds terms
- Optional correlation or portfolio exposure constraints

## Outputs

- Recommended stake size
- Kelly/fixed-unit/proportional sizing rationale
- Portfolio exposure summary and cap checks

## Calculators

- Kelly criterion: `calculators/kelly.md`
- Fixed units: `calculators/fixed-units.md`
- Proportional risk: `calculators/proportional.md`
