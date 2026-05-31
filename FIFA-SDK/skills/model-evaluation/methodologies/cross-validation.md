# Cross-validation

Assess model generalization with time-aware splitting.

## Recommended approach
For sports time series, prefer rolling / expanding window validation.

## Steps
1. Define evaluation windows (e.g., train on weeks 1–k, test on k+1).
2. Train model on the training window.
3. Generate predictions for the test window.
4. Compute scoring metrics (Brier/log loss) and ROI.
5. Aggregate metrics across folds.

## Outputs
- Mean and variance of metrics
- Identification of drift: performance changes by time
