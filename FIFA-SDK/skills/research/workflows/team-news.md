# Team news workflow

Goal: synthesize injury/suspension/availability info into lineup-impact notes.

## Inputs
- Teams/players of interest
- Time window to search (e.g., last 24–72h)
- Severity rules (optional)

## Steps
1. Collect source snippets
   - Injury reports, training updates, press conferences, official announcements.
2. Deduplicate and classify
   - In/out/doubtful/routine rest.
3. Estimate lineup impact
   - Star/rotation threshold classification.
4. Resolve conflicts
   - When sources disagree, mark uncertainty and propose “wait and refresh” behavior.
5. Output actionable adjustment notes
   - Which model inputs to adjust and what risk flags to set.

## Outputs
- `TeamNewsContext`
  - player availability summary
  - confidence per update
  - risk flags for uncertainty
