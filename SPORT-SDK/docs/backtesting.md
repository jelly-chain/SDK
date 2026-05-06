# Backtesting

## Running a Backtest

```ts
const results = await sdk.backtesting.run({
  league: 'premier-league',
  season: '2024/2025',
});

console.log(results.accuracy);    // e.g. 0.58
console.log(results.brierScore);  // e.g. 0.22
console.log(results.logLoss);     // e.g. 0.65
```

## Scoring Metrics

| Metric | Function | Description |
|---|---|---|
| Accuracy | `accuracy(preds, actuals)` | % correct binary predictions |
| Brier Score | `brierScore(preds, actuals)` | Mean squared error (lower = better) |
| Log Loss | `logLoss(preds, actuals)` | Cross-entropy loss (lower = better) |
| Calibration Error | `calibrationError(preds, actuals)` | ECE — how well probabilities are calibrated |

## Historical Snapshots

Load historical fixture/standing data for offline backtesting:

```ts
sdk.historicalLoader.register({
  league: 'nba',
  season: '2023/2024',
  asOfDate: '2024-06-17',
  fixtures: [...],
  standings: [...],
});
```

## Generating Reports

```ts
import { BacktestReport } from 'sports-jelly-sdk';

const report = BacktestReport.build([results], 'Premier League 2024/25');
const markdown = BacktestReport.toMarkdown(report);
```
