# Two-platform arbitrage strategy

Goal: find an edge by comparing the implied probabilities between platform A and platform B.

## Inputs
- Proposition/market description
- Odds/price snapshots from platform A and B
- (Optional) bet size constraints and allowed bet types

## Steps
1. Normalize the market
   - Map outcome labels across platforms.
   - Convert prices/odds into implied probabilities consistently.

2. Check for no-arb and rounding effects
   - Apply vig/overround normalization if required by your market format.
   - Add a minimum edge threshold to avoid noise.

3. Compute EV for the proposed hedge
   - Use the SDK’s EV/arbitrage utilities (model/market framing).

4. Output execution guidance
   - Provide recommended bet direction per platform.
   - Include risk flags: liquidity, stale odds, missing odds, settlement mismatch.

## Outputs
- `ArbitragePlan` with legs, expected edge, and confidence
