# Log loss

Compute log loss for probabilistic classification.

## Definition
For binary outcomes:
- if y=1: `-log(p)`
- if y=0: `-log(1-p)`

Use mean across samples.

## Interpretation
- Lower is better.
- Heavily penalizes confident wrong predictions.

## Guardrails
- Clip probabilities to `[eps, 1-eps]` to avoid `log(0)`.
- Keep consistent label mapping.
