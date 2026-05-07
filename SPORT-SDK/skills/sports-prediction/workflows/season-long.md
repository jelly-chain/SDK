# Season-long workflow

Goal: provide longer-horizon context (trend + strength) that improves pre-match estimates.

## Inputs
- League/sport
- Teams/players of interest
- Time window (optional: last N matches, season-to-date)
- Prediction target (title race, playoff placement, match outcome)

## Steps
1. **Establish season baseline**
   - Use resolved league context to determine relevant teams and season phase.

2. **Build trend signals**
   - Capture recent form trend, variance, and schedule sensitivity.
   - Track whether teams are over/under-performing vs baseline.

3. **Adjust priors with season-long strength**
   - Incorporate strength-of-schedule and home/away splits.
   - Apply injury/rotation durability notes if they persist.

4. **Translate to prediction framing**
   - For match outcomes: output updated priors suitable for pre-match analysis.
   - For standings questions: output title/bubble/relegation probabilities.

5. **Return season-long structured output**
   - `signals` should reflect confidence in trend stability.
   - `riskFlags` should note volatility (e.g., coaching change, roster churn).

## Outputs
- `PredictionSeasonContext`
  - signals: trend confidence, risk flags
  - evidence: trend history, split performance, schedule notes
  - explanation + disclaimer
