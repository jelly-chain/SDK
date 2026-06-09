// chain-connector/src/utils.ts

import { ChainConfig, ChainId, ConnectorConfig } from './types.js';

/**
 * Default chain configurations with public RPC endpoints.
 */
export const DEFAULT_CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  ethereum: {
    chainId: 'ethereum', name: 'Ethereum', nativeSymbol: 'ETH', nativeDecimals: 18,
    chainIdNumeric: 1, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 12000,
    rpc: [
      { url: 'https://eth.llamarpc.com', weight: 10, rateLimitPerSecond: 10 },
      { url: 'https://rpc.ankr.com/eth', weight: 8, rateLimitPerSecond: 10 },
    ],
  },
  bnb: {
    chainId: 'bnb', name: 'BNB Chain', nativeSymbol: 'BNB', nativeDecimals: 18,
    chainIdNumeric: 56, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 3000,
    rpc: [
      { url: 'https://bsc-dataseed.binance.org', weight: 10, rateLimitPerSecond: 10 },
      { url: 'https://rpc.ankr.com/bsc', weight: 8, rateLimitPerSecond: 10 },
    ],
  },
  polygon: {
    chainId: 'polygon', name: 'Polygon', nativeSymbol: 'MATIC', nativeDecimals: 18,
    chainIdNumeric: 137, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 2000,
    rpc: [
      { url: 'https://polygon-rpc.com', weight: 10, rateLimitPerSecond: 10 },
      { url: 'https://rpc.ankr.com/polygon', weight: 8, rateLimitPerSecond: 10 },
    ],
  },
  arbitrum: {
    chainId: 'arbitrum', name: 'Arbitrum One', nativeSymbol: 'ETH', nativeDecimals: 18,
    chainIdNumeric: 42161, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 250,
    rpc: [
      { url: 'https://arb1.arbitrum.io/rpc', weight: 10, rateLimitPerSecond: 10 },
      { url: 'https://rpc.ankr.com/arbitrum', weight: 8, rateLimitPerSecond: 10 },
    ],
  },
  optimism: {
    chainId: 'optimism', name: 'Optimism', nativeSymbol: 'ETH', nativeDecimals: 18,
    chainIdNumeric: 10, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 2000,
    rpc: [
      { url: 'https://mainnet.optimism.io', weight: 10, rateLimitPerSecond: 10 },
      { url: 'https://rpc.ankr.com/optimism', weight: 8, rateLimitPerSecond: 10 },
    ],
  },
  base: {
    chainId: 'base', name: 'Base', nativeSymbol: 'ETH', nativeDecimals: 18,
    chainIdNumeric: 8453, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 2000,
    rpc: [
      { url: 'https://mainnet.base.org', weight: 10, rateLimitPerSecond: 10 },
      { url: 'https://rpc.ankr.com/base', weight: 8, rateLimitPerSecond: 10 },
    ],
  },
  avalanche: {
    chainId: 'avalanche', name: 'Avalanche C-Chain', nativeSymbol: 'AVAX', nativeDecimals: 18,
    chainIdNumeric: 43114, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 2000,
    rpc: [
      { url: 'https://api.avax.network/ext/bc/C/rpc', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
  cronos: {
    chainId: 'cronos', name: 'Cronos', nativeSymbol: 'CRO', nativeDecimals: 18,
    chainIdNumeric: 25, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 6000,
    rpc: [
      { url: 'https://evm.cronos.org', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
  solana: {
    chainId: 'solana', name: 'Solana', nativeSymbol: 'SOL', nativeDecimals: 9,
    chainIdNumeric: 0, isEvm: false, isSolana: true, isUtxo: false, blockTimeMs: 400,
    rpc: [
      { url: 'https://api.mainnet-beta.solana.com', weight: 10, rateLimitPerSecond: 10 },
      { url: 'https://rpc.ankr.com/solana', weight: 8, rateLimitPerSecond: 10 },
    ],
  },
  bitcoin: {
    chainId: 'bitcoin', name: 'Bitcoin', nativeSymbol: 'BTC', nativeDecimals: 8,
    chainIdNumeric: 0, isEvm: false, isSolana: false, isUtxo: true, blockTimeMs: 600000,
    rpc: [],
  },
  dogecoin: {
    chainId: 'dogecoin', name: 'Dogecoin', nativeSymbol: 'DOGE', nativeDecimals: 8,
    chainIdNumeric: 0, isEvm: false, isSolana: false, isUtxo: true, blockTimeMs: 60000,
    rpc: [],
  },
  litecoin: {
    chainId: 'litecoin', name: 'Litecoin', nativeSymbol: 'LTC', nativeDecimals: 8,
    chainIdNumeric: 0, isEvm: false, isSolana: false, isUtxo: true, blockTimeMs: 150000,
    rpc: [],
  },
  xrp: {
    chainId: 'xrp', name: 'XRP Ledger', nativeSymbol: 'XRP', nativeDecimals: 6,
    chainIdNumeric: 0, isEvm: false, isSolana: false, isUtxo: false, blockTimeMs: 4000,
    rpc: [
      { url: 'https://s1.ripple.com:51234', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
  polkadot: {
    chainId: 'polkadot', name: 'Polkadot', nativeSymbol: 'DOT', nativeDecimals: 10,
    chainIdNumeric: 0, isEvm: false, isSolana: false, isUtxo: false, blockTimeMs: 6000,
    rpc: [
      { url: 'https://rpc.polkadot.io', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
  sui: {
    chainId: 'sui', name: 'Sui', nativeSymbol: 'SUI', nativeDecimals: 9,
    chainIdNumeric: 0, isEvm: false, isSolana: false, isUtxo: false, blockTimeMs: 3000,
    rpc: [
      { url: 'https://fullnode.mainnet.sui.io', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
  ton: {
    chainId: 'ton', name: 'TON', nativeSymbol: 'TON', nativeDecimals: 9,
    chainIdNumeric: 0, isEvm: false, isSolana: false, isUtxo: false, blockTimeMs: 5000,
    rpc: [
      { url: 'https://toncenter.com/api/v2/jsonRPC', weight: 10, rateLimitPerSecond: 5 },
    ],
  },
  fantom: {
    chainId: 'fantom', name: 'Fantom', nativeSymbol: 'FTM', nativeDecimals: 18,
    chainIdNumeric: 250, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 1000,
    rpc: [
      { url: 'https://rpc.ftm.tools', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
  gnosis: {
    chainId: 'gnosis', name: 'Gnosis Chain', nativeSymbol: 'xDAI', nativeDecimals: 18,
    chainIdNumeric: 100, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 5000,
    rpc: [
      { url: 'https://rpc.gnosischain.com', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
  celo: {
    chainId: 'celo', name: 'Celo', nativeSymbol: 'CELO', nativeDecimals: 18,
    chainIdNumeric: 42220, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 5000,
    rpc: [
      { url: 'https://forno.celo.org', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
  harmony: {
    chainId: 'harmony', name: 'Harmony', nativeSymbol: 'ONE', nativeDecimals: 18,
    chainIdNumeric: 1666600000, isEvm: true, isSolana: false, isUtxo: false, blockTimeMs: 2000,
    rpc: [
      { url: 'https://api.harmony.one', weight: 10, rateLimitPerSecond: 10 },
    ],
  },
};

/**
 * Build chain configs from user-provided connector config.
 */
export function buildChainConfigs(config: ConnectorConfig): Map<ChainId, ChainConfig> {
  const result = new Map<ChainId, ChainConfig>();
  for (const [chainId, chainConf] of Object.entries(config)) {
    const defaults = DEFAULT_CHAIN_CONFIGS[chainId as ChainId];
    if (!defaults) continue;
    result.set(chainId as ChainId, {
      ...defaults,
      rpc: chainConf.rpc.map(url => ({
        url,
        weight: 10,
        rateLimitPerSecond: 10,
        isWs: url.startsWith('wss://'),
      })),
    });
  }
  return result;
}
