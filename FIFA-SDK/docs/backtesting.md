# Backtesting

How to evaluate prediction heuristics against historical World Cup data.

## Basic Backtest

```ts
const result = await sdk.backtesting.run({
  tournamentYear: 2022,
  marketType: 'MATCH_WINNER',
});

console.log(`Accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
console.log(`Calibration Error: ${result.calibrationError.toFixed(3)}`);
```

## Multi-Year Comparison

```ts
const results = await sdk.backtesting.compareYears([2018, 2022], 'GROUP_WINNER');
```

## Loading Historical Data

Register historical snapshots using the `HistoricalLoader`:

```ts
import { HistoricalLoader } from 'world-cup-jelly-sdk';

const loader = new HistoricalLoader();
loader.register({
  year: 2022,
  fixtures: [...],
  standings: { A: [...], B: [...] },
  winner: 'team-argentina',
});
```

## Scoring Metrics

- **Brier Score**: Mean squared error between predicted probability and outcome (lower = better).
- **Log Loss**: Logarithmic loss — penalizes overconfident wrong predictions more.
- **Calibration Error**: Mean absolute difference between predicted probability and actual win rate.
- **Accuracy**: Fraction of predictions where the model correctly identified the winner.
