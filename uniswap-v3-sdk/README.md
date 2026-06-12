# Uniswap V3 SDK

Concentrated liquidity, tick math, position management, and routing for Uniswap V3.

## Features

- Pool management (`getPool`, `getAllPoolsForPair`, `getPoolLiquidity`)
- Tick data (`getTicks`, `tickToPrice`, `priceToTick`, `calculateImpermanentLoss`)
- Quoting (`quoteExactInputSingle`, `quoteExactOutputSingle`, `quoteMultiHop`)
- Swapping (`swapExactInputSingle`, `swapMultiHop`, `unwrapWeth`)
- Position management (`mintPosition`, `increaseLiquidity`, `decreaseLiquidity`, `collectFees`, `burnPosition`)
- Analytics (`getPoolDayData`, `getTopPools`, `getPoolFeeApr`)

## Installation

```bash
npm install @jellychain/uniswap-v3-sdk
```

## Usage

```typescript
import { UniswapV3SDK, ChainId, UniswapV3FeeTier } from "@jellychain/uniswap-v3-sdk";

const sdk = new UniswapV3SDK({ chainId: ChainId.ETHEREUM });

// Get pool data
const pool = await sdk.getPool("0xA0b86a33...", "0xC02aa053...", UniswapV3FeeTier.MEDIUM);

// Quote a swap
const quote = await sdk.quoteExactInputSingle(tokenIn, tokenOut, amountIn, UniswapV3FeeTier.MEDIUM);

// Calculate impermanent loss
const il = sdk.calculateImpermanentLoss(1.2); // 20% price change
```

## Fee Tiers

| Fee | Tick Spacing |
|-----|------------|
| 100 | 1 (Ticks: 0.0001% range) |
| 500 | 10 (Ticks: 0.01% range) |
| 3000 | 60 (Ticks: 0.1% range) |
| 10000 | 200 (Ticks: 1% range) |

## Status

✅ Production-ready