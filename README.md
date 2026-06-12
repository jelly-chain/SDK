# SDK-MAIN — JellyOS / JellyClaude Intelligence Layer

> **177 Production SDKs · Agent-first prediction & trading infrastructure.**

![SDKs](https://img.shields.io/badge/SDKs-177%20Production-blue)
![Commits](https://img.shields.io/badge/Commits-194-green)
![Vulnerabilities](https://img.shields.io/badge/Vulnerabilities-0-brightgreen)

This repository contains the complete SDK ecosystem for JellyOS and JellyClaude — AI agent systems that generate predictions, detect arbitrage, and make data-driven decisions across prediction markets (Polymarket, Kalshi), sports betting, and DeFi.

---

## Quick Start

```bash
# Clone the monorepo
git clone https://github.com/jelly-chain/SDK
cd SDK

# Install all dependencies (uses npm workspaces)
npm install

# Build all SDKs
npm run build --workspaces

# Build a specific SDK
cd uniswap-v3-sdk && npm run build
```

---

## Installation

```bash
# Import from any SDK
import { UniswapV3SDK } from "@jellychain/uniswap-v3-sdk";
import { FIFA-SDK } from "@jellychain/fifa-sdk";
import { SPORT-SDK } from "@jellychain/sport-sdk";
```

---

## SDK Categories

```
SDK-main/
├── 🏆 CORE SDKs (4)
│   ├── FIFA-SDK/                    World Cup & football intelligence
│   ├── SPORT-SDK/                   Multi-sport (NBA, NFL, Football, etc.)
│   ├── Prediction-V2-main/         Crypto/DeFi market prediction
│   └── market-prediction-sdk-main/  V1 prediction (deprecated)
│
├── 📊 DATA PROVIDERS (5)
│   ├── sportradar-sdk/              Tier 1 sports data
│   ├── espn-live-sdk/               Free fallback sports scores
│   ├── weather-venue-sdk/           Weather impact analysis
│   ├── chainlink-sdk/               Decentralized oracle
│   └── pyth-network-sdk/            Low-latency price feeds
│
├── 🏦 DEFI PRIMITIVES (50+)
│   ├── DEX/: Uniswap, Balancer, Curve, PancakeSwap, SushiSwap...
│   ├── AGGREGATORS/: 1inch, Cow, Paraswap, Kyber, Jupiter...
│   ├── PERPS/: Drift, GMX, Hyperliquid, Vertex, Zeta...
│   ├── LENDING/: Aave, Compound, Morpho, Lido, Maker...
│   └── YIELD/: Aura, Beefy, Yearn, StakeDAO, Pendle...
│
├── ⚽ SPORTS & PREDICTION MARKETS (15)
│   ├── kalshi-v3-sdk/               Kalshi CFTC-regulated markets
│   ├── polymarket-clob-sdk/         Polymarket CLOB
│   ├── metaculus-sdk/               Crowd forecasting
│   ├── manifold-sdk/                Play-money markets
│   └── betfair-exchange-sdk/        Betting exchange
│
├── 👾 NFT & GAMING (20+)
│   ├── opensea-sdk/                 NFT marketplace
│   ├── sudoswap-sdk/                NFT AMM
│   ├── nftfi-sdk/                   NFT lending
│   ├── esports-sdk/                 LoL, CS2, Valorant
│   └── cricket-sdk/                 IPL, ICC
│
├── 📈 SIGNAL & ANALYTICS (10+)
│   ├── social-sentiment-sdk/        Twitter/Reddit analysis
│   ├── line-movement-sdk/           Odds tracking
│   └── events-intelligence-sdk/       Event triggers
│
└── 📦 SHARED PACKAGES
    ├── sdk-core/                    Base SDK class
    └── shared-types/                Common TypeScript types
```

---

## Usage with Claude

Add to your Claude system prompt:

```
You have access to 177 SDKs in the jelly-chain/SDK repository.
Available SDKs include:
- Prediction: FIFA-SDK, SPORT-SDK, Prediction-V2, Polymarket, Kalshi
- DeFi: Uniswap, Balancer, Curve, Aave, Compound, PancakeSwap
- NFT: OpenSea, LooksRare, NFTfi, SudoSwap
- Sports: Sportradar, ESPN, Esports, Cricket

Import pattern: import { SDKClass } from "@jellychain/sdk-name"
```

---

## Usage with JellyOS

JellyOS agents can directly import any SDK:

```typescript
// In your agent
import { PredictionV2 } from "@jellychain/prediction-v2-main";
import { PolymarketCLOB } from "@jellychain/polymarket-clob-sdk";

const predictor = new PredictionV2({ chainId: ChainId.ETHEREUM });
const markets = await predictor.getMarkets();
```

---

## Usage with Codex/AI Agents

Agents can discover available SDKs:

```bash
# List all SDK directories
ls -d */

# Each SDK follows the same pattern:
# src/client.ts - Main implementation
# src/index.ts - Exports
# package.json - Dependencies
```

---

## Development

Each SDK follows the same architecture pattern:

```
sdk-name/
├── src/
│   ├── client.ts      SDK implementation
│   └── index.ts       Public exports
├── package.json       npm package config
├── tsconfig.json      TypeScript config
└── README.md          SDK-specific docs
```

---

## Contributing

1. Fork the repository
2. Create your SDK directory: `mkdir my-sdk/src`
3. Implement `client.ts` extending `BaseSDK`
4. Export from `index.ts`
5. Add `package.json` with `@jellychain/shared-types` dependency
6. Test and submit PR

---

## License

MIT — Jelly Chain
