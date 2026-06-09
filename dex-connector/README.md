# @jellychain/dex-connector

> Universal DEX aggregator and router for the JellyChain ecosystem.

Provides price quotes, optimal routing, swap execution, and liquidity management across Uniswap V2/V3, Raydium, Orca, Curve, Balancer, PancakeSwap, Camelot, Trader Joe, and more.

```typescript
import { DexConnector } from '@jellychain/dex-connector';

const dex = new DexConnector({ chainId: 1 });

// Get best quote across all DEXes
const quote = await dex.getBestQuote({
  tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',  // WETH
  tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  amountIn: '1000000000000000000', // 1 ETH
  slippage: 0.5,
});

console.log(quote); // { bestDex, amountOut, route, priceImpact }

// Execute swap
const result = await dex.swap({
  tokenIn: '0x...',
  tokenOut: '0x...',
  amountIn: '1000000000000000000',
  recipient: '0x...',
  deadline: Math.floor(Date.now() / 1000) + 300,
});
```

## Supported DEXes

| DEX | Chain | Type |
|---|---|---|
| Uniswap V2 | Ethereum, BNB, Polygon | AMM |
| Uniswap V3 | Ethereum, Arbitrum, Optimism, Base, BNB, Polygon | Concentrated Liquidity |
| Raydium | Solana | AMM / CLMM |
| Orca | Solana | CLMM |
| Curve | Ethereum, Arbitrum, Polygon, Optimism | StableSwap |
| Balancer | Ethereum, Arbitrum, Polygon | Weighted Pool |
| PancakeSwap | BNB, Ethereum | AMM |
| Camelot | Arbitrum | AMM |
| Trader Joe | Avalanche | AMM |

## License

MIT — JellyChain 🐙
