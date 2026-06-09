# @jellychain/order-engine

> Centralized order management system for the JellyChain ecosystem.

Supports Limit, Market, Stop-Loss, Trailing-Stop, Take-Profit, OCO (One-Cancels-Other), and Scale orders with full lifecycle management, position tracking, PnL calculation, and risk controls.

```typescript
import { OrderEngine } from '@jellychain/order-engine';

const engine = new OrderEngine();

const order = await engine.placeOrder({
  type: 'limit',
  side: 'buy',
  token: '0x...',
  amount: '1000',
  price: '1.5',
  chain: 'ethereum',
});

engine.on('filled', (order) => console.log(`Filled: ${order.id}`));
engine.on('stopTriggered', (order) => console.log(`Stop hit: ${order.id}`));
```

## Order Types

| Type | Description |
|---|---|
| `limit` | Execute at specified price or better |
| `market` | Execute immediately at best available price |
| `stop-loss` | Market sell when price drops below threshold |
| `take-profit` | Market sell when price rises above threshold |
| `oco` | One-Cancels-Other: take-profit + stop-loss pair |
| `trailing-stop` | Stop that follows price upward |
| `scale` | Multiple limit orders at incremental prices |

## License

MIT — JellyChain 🐙
