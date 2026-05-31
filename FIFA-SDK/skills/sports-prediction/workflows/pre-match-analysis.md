# Pre-match analysis workflow

Goal: turn a sports prediction question into structured context before kickoff.

## Inputs
- Question text (market/fixture/proposition)
- League/sport (if known)
- Desired platforms/odds sources (optional)
- Risk preference (optional)

## Steps
1. **Resolve the question**
   - Call `resolve_sports_prediction_question`.
   - Extract sport/league, teams/players, market type, and any available fixture identifiers.

2. **Fetch priors and baseline probabilities**
   - Call `get_prediction_priors`.
   - Capture model priors (home/away strength, form baseline, matchup factors) and raw probability.

3. **Collect supporting evidence**
   - Include standings context (title race/bubble/relegation) when relevant.
   - Include injuries/suspensions, lineup uncertainty, and rotation risk.
   - Capture any relevant head-to-head narrative tags.

4. **Convert to market-compatible framing**
   - If the question is market-based, align model probability to the implied market probability.
   - Compute an edge estimate (model minus implied) and flag missing data.

5. **Produce final structured output**
   - Include `signals.confidence` and `signals.riskFlags`.
   - Provide `evidence` sections and a short explanation.
   - Always include the SDK model disclaimer.

## Outputs
- `PredictionPreMatchContext`
  - signals: confidence, risk flags, narrative tags
  - evidence: injuries/form/standings/odds context
  - explanation + disclaimer
