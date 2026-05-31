# Live Events — Agent Skill

This skill enables a Jelly Claude agent to detect meaningful live changes (goals, injuries, odds spikes) and convert them into actionable alerts.

## When to Use This Skill

Use this skill when:
- You want to react to goals, cards, substitutions, or momentum shifts.
- You need instant notification when key players are injured/ruled out.
- You want to catch odds spikes and evaluate whether they reflect information or noise.

## Supported Inputs

- Fixture/market identifier
- Trigger type (goal, injury, odds spike)
- Thresholds and cooldown rules

## Outputs

- Alert payload with timestamp
- Reasoning about which signal changed
- Suggested next step (refresh odds, re-run model, adjust stake)

## Triggers
- `triggers/goal-alert.md`
- `triggers/injury-update.md`
- `triggers/odds-spike.md`
