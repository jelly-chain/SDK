# Live-betting workflow

Goal: update win/lose probabilities and betting recommendations as the match progresses.

## Inputs
- Resolved fixture/market identifier from pre-match
- Current match clock/event state (if available)
- Latest odds/price snapshots (optional)

## Steps
1. **Load live context**
   - Call `get_prediction_live_context`.
   - Capture event timeline changes (goals, cards, injuries), current score state, and any momentum indicators.

2. **Update confidence with live signals**
   - Identify which factors changed since pre-match.
   - Update risk flags (e.g., injury worsened, tempo shift, lineup deviation).

3. **Compute price-vs-model edge**
   - Translate updated model probability into implied odds terms.
   - Compare vs current market price.

4. **Apply betting constraints**
   - If risk flags indicate high variance or missing data, lower confidence.
   - Output “no-trade / wait” guidance when edge is insufficient.

5. **Return structured live output**
   - Provide updated `signals` and `evidence` diffs.
   - Provide a short, readable summary plus disclaimer.

## Outputs
- `PredictionLiveContext`
  - signals: updated confidence, risk flags, narrative tags
  - evidence: live events + updated form context
  - explanation + disclaimer
