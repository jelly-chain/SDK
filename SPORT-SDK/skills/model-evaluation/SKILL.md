# Model Evaluation — Agent Skill

This skill enables a Jelly Claude agent to evaluate sports prediction models using scoring rules, validation procedures, and ROI analysis.

## When to Use This Skill

Use this skill when:
- Comparing two models or versions over the same historical dataset.
- Validating probabilistic predictions with proper scoring rules.
- Measuring real-world performance using ROI under a defined betting strategy.

## Supported Inputs
- Historical predictions (probabilities) and realized outcomes
- Optional model metadata (version, features, training window)
- Optional betting rules (stake sizing, odds) for ROI

## Outputs
- Metric summaries (Brier score, log loss)
- Cross-validation results
- ROI analysis and sensitivity notes

## Methodologies
- `methodologies/brier-score.md`
- `methodologies/log-loss.md`
- `methodologies/roi-analysis.md`
- `methodologies/cross-validation.md`
