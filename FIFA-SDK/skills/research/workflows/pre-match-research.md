# Pre-match research workflow

Goal: build evidence-backed context before kickoff.

## Inputs
- Fixture identifiers (teams, league, event date/time)
- Evidence freshness SLA (optional)
- Prediction target (match outcome, totals, placement, etc.)

## Steps
1. Collect baseline context
   - League context, schedule phase, typical matchup narratives.
2. Gather evidence
   - Team news, lineup/availability rumors.
   - Recent trends and relevant situational factors.
3. Normalize and score evidence quality
   - Source reliability, recency, and whether reports agree.
4. Translate evidence into prediction adjustments
   - Update priors and add risk flags for uncertainty.
5. Produce structured output
   - Output `evidence` + `signals`.
   - Include an explanation of how the evidence changes the model/edge.

## Outputs
- `PreMatchResearchContext`
  - evidence blocks (injuries, news, situational notes)
  - risk flags (stale, conflicting, low-confidence)
  - prior adjustment notes
