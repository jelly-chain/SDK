# Brier score

Compute Brier score to measure mean squared error of probabilistic forecasts.

## Definition
For binary outcomes, with predicted probability `p` and outcome `y ∈ {0,1}`:
- `Brier = (p - y)^2`

Use the mean across all instances.

## Interpretation
- Lower is better.
- Proper scoring rule: encourages honest probability estimation.

## Guardrails
- Ensure probabilities are in [0,1].
- For multi-class, use vector generalization (sum of squared errors across classes).
