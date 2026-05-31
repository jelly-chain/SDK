# Multi-outcome arbitrage strategy

Goal: construct a hedge across multiple outcomes (e.g., 1X2 or totals) using mispriced legs.

## Inputs
- Market type (e.g., 1X2, double-chance, totals)
- Odds across all outcomes for each candidate platform
- Budget and max legs

## Steps
1. Build a consistent outcome graph
   - Ensure all outcomes map correctly.
   - Handle correlated legs (e.g., totals over/under) via normalization assumptions.

2. Compute implied probabilities per platform
   - Convert each outcome to implied probability.
   - Identify inconsistent probability mass and compute edge.

3. Select best combination
   - Choose platform/outcome assignments that maximize risk-adjusted EV.
   - Enforce budget and max-leg constraints.

4. Risk gating
   - Fail closed on missing odds or high variance.
   - Flag settlement/runner-definition mismatches.

## Outputs
- `MultiOutcomeArbitragePlan` with leg breakdown and EV
