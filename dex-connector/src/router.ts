import { DexName, DexConfig, ChainId } from '../types.js';

/**
 * Registry of known DEX configurations.
 */
export const DEX_REGISTRY: Record<string, DexConfig> = {
  // Ethereum
  '1_uniswap_v2': {
    name: 'uniswap_v2', chainId: 1,
    routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    isV3: false, isClmm: false,
  },
  '1_uniswap_v3': {
    name: 'uniswap_v3', chainId: 1,
    routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    isV3: true, isClmm: false,
    feeTiers: [500, 3000, 10000],
  },
  '1_curve': {
    name: 'curve', chainId: 1,
    routerAddress: '0x99a58482BD75cbab83b27EC03CA68fF489b5788f',
    factoryAddress: '0x0959158b6040D32d04c301A72CBFD6b39E21c9AE',
    isV3: false, isClmm: false,
  },
  '1_balancer': {
    name: 'balancer', chainId: 1,
    routerAddress: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    factoryAddress: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    isV3: false, isClmm: false,
  },
  // BNB Chain
  '56_pancakeswap': {
    name: 'pancakeswap', chainId: 56,
    routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    isV3: false, isClmm: false,
  },
  '56_uniswap_v3': {
    name: 'uniswap_v3', chainId: 56,
    routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    factoryAddress: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
    isV3: true, isClmm: false,
    feeTiers: [500, 3000, 10000],
  },
  // Arbitrum
  '42161_uniswap_v3': {
    name: 'uniswap_v3', chainId: 42161,
    routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    isV3: true, isClmm: false,
    feeTiers: [500, 3000, 10000],
  },
  '42161_camelot': {
    name: 'camelot', chainId: 42161,
    routerAddress: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
    factoryAddress: '0x6EcCab422D763aC031210895C81787E87B43A652',
    isV3: false, isClmm: false,
  },
  // Solana (chainId 0 for identification)
  '0_raydium': {
    name: 'raydium', chainId: 0,
    routerAddress: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    factoryAddress: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    isV3: false, isClmm: true,
  },
  '0_orca': {
    name: 'orca', chainId: 0,
    routerAddress: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    factoryAddress: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    isV3: false, isClmm: true,
  },
  // Avalanche
  '43114_traderjoe': {
    name: 'traderjoe', chainId: 43114,
    routerAddress: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
    factoryAddress: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
    isV3: false, isClmm: false,
  },
};

export function getDexConfig(chainId: ChainId, name: DexName): DexConfig | undefined {
  return DEX_REGISTRY[`${chainId}_${name}`];
}

export function getDexesForChain(chainId: ChainId): DexConfig[] {
  return Object.values(DEX_REGISTRY).filter(d => d.chainId === chainId);
}
