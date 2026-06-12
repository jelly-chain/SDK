# Balancer V3 SDK

Balancer V3 SDK for weighted pools, boosted pools, vault management, and hooks.

## Features

- Pool management (getPool, getPoolsByType, getPoolTokens)
- Pool creation with hooks support
- Swapping (quoteSwap, swap, swapMultiRoute)
- Liquidity management (joinPool, exitPool, addLiquidityUnbalanced, removeLiquiditySingleToken)
- Protocol fees (setProtocolFees, collectProtocolFees)
- Weighted pool math (calculateSpotPrice, calculateOutGivenIn, calculatePriceImpact)
- Analytics (getTopPools, getPoolHistoricalData)

## Installation

```bash
npm install @jellychain/balancer-v3-sdk
```

## Usage

```typescript
import { BalancerV3SDK, ChainId, BalancerPoolType } from "@jellychain/balancer-v3-sdk";

const sdk = new BalancerV3SDK({ chainId: ChainId.Ethereum });

// Create weighted pool
await sdk.createPool("MyPool", "MPOOL", 
  [{ token: tokenA, weight: 0.6 }, { token: tokenB, weight: 0.4 }], 
  0.003, BalancerPoolType.WEIGHTED
);

// Add liquidity
await sdk.addLiquidityUnbalanced(poolId, [1000n, 2000n]);

// Swap
await sdk.swap({ pool: poolId, tokenIn: tokenA, tokenOut: tokenB, amount: 1000n, kind: "GIVEN_IN" });
```

## Status

✅ Production-ready