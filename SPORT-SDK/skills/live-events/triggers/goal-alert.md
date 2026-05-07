# Goal alert trigger

Goal: alert when a significant in-event milestone occurs (e.g., goal scored) that changes implied probabilities.

## Inputs
- Fixture id
- Event type (goal, card, penalty, substitution)
- Minimum significance rules (optional)
- Cooldown to prevent alert spam

## Steps
1. Listen to event feed / update stream.
2. Filter event types to configured ones.
3. Debounce with cooldown.
4. Produce an alert that includes:
   - event payload (who/what)
   - time
   - which markets likely affected

## Output
- `GoalAlert` with risk notes (volatility)
