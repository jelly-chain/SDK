# @jellychain/strategy-builder

> Declarative strategy builder with backtesting, optimization, and pre-built templates.

Build trading strategies using a composable condition → action model, backtest against historical data, and optimize parameters.

```typescript
import { StrategyBuilder } from '@jellychain/strategy-builder';

const strategy = new StrategyBuilder()
  .when('rsi', '<', 30)
  .and('volume', '>', 1000000)
  .then('buy', { amount: '1000' })
  .when('rsi', '>', 70)
  .then('sell', { amount: 'all' })
  .build();

const result = await strategy.backtest({ from: '2024-01-01', to: '2024-12-31' });
console.log(result); // { totalReturn, sharpe, maxDrawdown, trades }
```

## License

MIT — JellyChain 🐙
