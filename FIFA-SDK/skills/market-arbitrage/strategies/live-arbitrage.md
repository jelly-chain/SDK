# Live arbitrage strategy

Goal: identify fast-moving mispricings during the event.

## Inputs
- Pre-match market structure
- Live odds snapshots and timestamp
- Current event state (score, clock, cards, injuries) when available

## Steps
1. Refresh odds and validate timestamps
   - Ensure you compare odds at roughly the same moment.

2. Model a short-horizon adjustment
   - Use live signals to adjust priors before comparing.

3. Detect crossing edges
   - If implied probabilities cross a threshold, propose a hedge.

4. Execution constraints
   - Recommend conservative stake sizing when volatility is high.
   - Provide cancel/replace criteria if prices move again.

## Outputs
- `LiveArbitrageExecutionPlan` and “trade/skip” guidance
