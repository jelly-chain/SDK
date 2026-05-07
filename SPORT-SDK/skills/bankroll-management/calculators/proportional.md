# Proportional (risk-aware) staking

Allocate stake proportionally to expected value and risk limits.

## Inputs

- Bankroll
- Estimated EV or edge score
- Risk tolerance (max drawdown proxy)
- Optional cap: max stake % and max total exposure %

## Behavior

- Convert edge/EV to a stake fraction.
- Enforce stake caps and portfolio caps.
- Fail closed (stake 0) when EV signal is weak or missing.

## Outputs
- Stake recommendation
- Applied caps
- Risk flags when constraints block sizing
