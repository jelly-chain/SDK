# Uniswap V4 SDK

Uniswap V4 SDK for hooks, singleton pool manager, custom pools, and flash accounting.

## Features

- Pool creation with hooks support
- Singleton Pool Manager integration
- Position management (add/remove liquidity)
- Swapping with hooks
- Flash accounting
- Hook registration and management
- Multi-chain support

## Installation

```bash
npm install @jellychain/uniswap-v4-sdk
```

## Usage

```typescript
import { UniswapV4SDK, ChainId } from "@jellychain/uniswap-v4-sdk";

const sdk = new UniswapV4SDK({ chainId: ChainId.BASE });

// Create a pool with hooks
const pool = await sdk.createPool(tokenA, tokenB, 3000, 60, hookAddress, sqrtPriceX96);

// Swap with hooks
await sdk.swap({ poolKey, zeroForOne: true, amountSpecified: 1000n, sqrtPriceLimitX96: 0n });

// Manage hooks
sdk.registerHook({ address: hookAddr, name: "MyHook", types: [UniswapV4HookType.BEFORE_SWAP], gasEstimate: 50000, trusted: true });
```

## Status

✅ Production-ready (hooks support)