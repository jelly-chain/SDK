# @jellychain/chain-connector

> Unified RPC connector for 20+ blockchains in the JellyChain SDK ecosystem.

Provides a single interface to query balances, send transactions, and monitor events across Bitcoin, Ethereum, Solana, BNB Chain, Sui, TON, Dogecoin, XRP, Litecoin, Polkadot, Avalanche, Polygon, Arbitrum, Optimism, Base, Cronos, and more.

## Features

- **20+ chain support** — EVM, Solana, Bitcoin, Sui, TON, and more
- **Automatic failover** — retry across multiple RPC endpoints
- **Rate limiting** — token bucket algorithm per endpoint
- **Balance queries** — native + ERC20/SPL token balances
- **Transaction broadcasting** — chain-agnostic send interface
- **Event subscriptions** — WebSocket support where available

## Quick Start

```typescript
import { ChainConnector } from '@jellychain/chain-connector';

const cc = new ChainConnector({
  ethereum: { rpc: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'] },
  solana: { rpc: ['https://api.mainnet-beta.solana.com'] },
});

// Get native balance
const bal = await cc.getBalance('ethereum', '0x1234...');
console.log(bal); // { value: '1500000000000000000', decimals: 18, symbol: 'ETH' }

// Get token balance
const tokenBal = await cc.getTokenBalance('ethereum', '0x1234...', '0xA0b8...');

// Send transaction
const tx = await cc.sendTransaction('ethereum', signedTxHex);
```

## License

MIT — JellyChain 🐙
