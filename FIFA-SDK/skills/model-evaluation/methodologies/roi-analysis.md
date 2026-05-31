# ROI analysis

Estimate ROI based on a simple betting strategy tied to model probabilities.

## Inputs
- Predicted probabilities
- Realized outcomes
- Market odds (decimal) or payout multipliers
- Stake sizing rule (fixed, proportional, or Kelly fraction)

## Steps
1. Convert predictions into implied expected value / edge.
2. Decide whether to bet (threshold or sign(edge)).
3. Compute payoffs for bet outcomes.
4. Aggregate: total return, net profit, ROI = net / invested.

## Outputs
- ROI summary
- Bet hit-rate / calibration proxy
- Sensitivity: show ROI by threshold or stake fraction
