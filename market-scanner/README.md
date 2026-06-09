# @jellychain/market-scanner

> Real-time market scanning and signal generation for JellyChain.

Detects new token listings, volume spikes, liquidity changes, smart money movements, and trending narratives across multiple chains.

```typescript
import { MarketScanner } from '@jellychain/market-scanner';

const scanner = new MarketScanner({ chains: ['ethereum', 'solana', 'bnb'] });

// Start all scanners
scanner.on('volumeSpike', (signal) => console.log('Volume spike:', signal));
scanner.on('smartMoney', (signal) => console.log('Smart money:', signal));
scanner.on('newListing', (signal) => console.log('New listing:', signal));

await scanner.start();
```

## Features

- **New listing detection** — monitor DEX Factory events for new pairs
- **Volume spike detection** — abnormal volume with statistical thresholds
- **Liquidity tracking** — LP inflow/outflow monitoring
- **Smart money tracking** — whale and known-pro wallet activity
- **Narrative detection** — trending token categories and memes
- **Alert dispatch** — webhooks, Discord, Telegram notifications

## License

MIT — JellyChain 🐙
