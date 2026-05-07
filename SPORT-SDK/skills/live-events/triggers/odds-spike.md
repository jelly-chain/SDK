# Odds spike trigger

Goal: alert when market prices move beyond a threshold over a short time window.

## Inputs
- Fixture/market id
- Odds/price source
- Spike threshold (absolute or % change)
- Lookback window

## Steps
1. Track last N price points.
2. Compute delta vs baseline.
3. If delta > threshold, fire alert.
4. Include whether spike is consistent with live event signals.
5. Recommend immediate verification actions (check for data staleness).

## Output
- `OddsSpikeAlert` with magnitude, direction, and risk flags
