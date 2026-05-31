# Injury update trigger

Goal: alert when an injury report materially impacts participant availability.

## Inputs
- Fixture id / teams
- Injury event feed (player in/out)
- Severity classification (optional)
- Cooldown rules

## Steps
1. Detect change in availability status.
2. Match player to market relevance (star/rotation threshold).
3. Create alert with confidence that the update is real (feed timestamp).
4. Suggest next actions:
   - re-fetch lineups/injuries
   - re-run prediction/model inference

## Output
- `InjuryUpdateAlert` including missing/uncertain data flags
