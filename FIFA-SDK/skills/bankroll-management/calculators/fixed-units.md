# Fixed unit staking

Stake a constant number of units while tracking bankroll and unit value.

## Inputs

- Bankroll
- Unit size (% or absolute)
- Optional max units per day/week

## Behavior

- Convert “N units” into a stake amount.
- Track bankroll drift across bets.
- If bankroll drops below a threshold, reduce units or pause.

## Outputs
- Stake amount
- Updated bankroll and unit size
- Pause/continue decision
