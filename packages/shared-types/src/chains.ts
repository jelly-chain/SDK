/**
 * Chain & Network types — 25+ blockchain networks supported across all SDKs
 */

export enum ChainId {
  ETHEREUM = 1,
  BSC = 56,
  POLYGON = 137,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  BASE = 8453,
  AVALANCHE = 43114,
  SOLANA = 101,
  SUI = 100010,
  APTOS = 100020,
  NEAR = 100030,
  TON = 100040,
  TRON = 100050,
  BITCOIN = 100060,
  LINEA = 59144,
  SCROLL = 534352,
  ZKSYNC = 324,
  MANTLE = 5000,
  BLAST = 81457,
  SEI = 100002,
  OSMOSIS = 100011,
  INJECTIVE = 100012,
  COSMOS = 100013,
  SCROLL_ALPHA = 534351,
}

export enum ChainFamily {
  EVM = "evm",
  SOLANA = "solana",
  SUI = "sui",
  APTOS = "aptos",
  NEAR = "near",
  TON = "ton",
  TRON = "tron",
  BITCOIN = "bitcoin",
  COSMOS = "cosmos",
}

export interface ChainMetadata {
  chainId: ChainId;
  name: string;
  symbol: string;
  family: ChainFamily;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconUrl?: string;
  testnet: boolean;
  layer: "L1" | "L2" | "L3";
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  features: ChainFeature[];
  parentChain?: ChainId;
  bridgeContracts?: BridgeContracts;
}

export enum ChainFeature {
  EIP1559 = "eip1559",
  ERC4337 = "erc4337",
  NATIVE_ACCOUNT_ABSTRACTION = "native_account_abstraction",
  PUSH_ORACLE = "push_oracle",
  NATIVE_ORACLE = "native_oracle",
  ZK_PROOFS = "zk_proofs",
  OPTIMISTIC_ROLLUP = "optimistic_rollup",
  PROOF_OF_STAKE = "proof_of_stake",
  PROOF_OF_WORK = "proof_of_work",
  DELEGATED_POS = "delegated_pos",
  IBC = "ibc",
  MOVE_VM = "move_vm",
  WAMS = "wasm",
  PROGRAMMABLE = "programmable",
}

export interface BridgeContracts {
  l1StandardBridge?: string;
  l2StandardBridge?: string;
  l1CrossDomainMessenger?: string;
  portal?: string;
  l1ERC721Bridge?: string;
}

export const CHAIN_METADATA: Record<ChainId, ChainMetadata> = {
  [ChainId.ETHEREUM]: {
    chainId: ChainId.ETHEREUM, name: "Ethereum", symbol: "ETH",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
    blockExplorerUrls: ["https://etherscan.io"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.ERC4337, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.BSC]: {
    chainId: ChainId.BSC, name: "BNB Smart Chain", symbol: "BNB",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://bsc-dataseed1.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    features: [ChainFeature.PROOF_OF_STAKE, ChainFeature.EIP1559],
  },
  [ChainId.POLYGON]: {
    chainId: ChainId.POLYGON, name: "Polygon", symbol: "MATIC",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.ARBITRUM]: {
    chainId: ChainId.ARBITRUM, name: "Arbitrum One", symbol: "ETH",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
    testnet: false, layer: "L2",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.ERC4337, ChainFeature.OPTIMISTIC_ROLLUP],
    parentChain: ChainId.ETHEREUM,
  },
  [ChainId.OPTIMISM]: {
    chainId: ChainId.OPTIMISM, name: "Optimism", symbol: "ETH",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://mainnet.optimism.io"],
    blockExplorerUrls: ["https://optimistic.etherscan.io"],
    testnet: false, layer: "L2",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.ERC4337, ChainFeature.OPTIMISTIC_ROLLUP],
    parentChain: ChainId.ETHEREUM,
  },
  [ChainId.BASE]: {
    chainId: ChainId.BASE, name: "Base", symbol: "ETH",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
    testnet: false, layer: "L2",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.ERC4337, ChainFeature.OPTIMISTIC_ROLLUP],
    parentChain: ChainId.ETHEREUM,
  },
  [ChainId.AVALANCHE]: {
    chainId: ChainId.AVALANCHE, name: "Avalanche C-Chain", symbol: "AVAX",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.SOLANA]: {
    chainId: ChainId.SOLANA, name: "Solana", symbol: "SOL",
    family: ChainFamily.SOLANA, decimals: 9,
    rpcUrls: ["https://api.mainnet-beta.solana.com"],
    blockExplorerUrls: ["https://explorer.solana.com"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "SOL", symbol: "SOL", decimals: 9 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.PROOF_OF_STAKE, ChainFeature.NATIVE_ORACLE],
  },
  [ChainId.SUI]: {
    chainId: ChainId.SUI, name: "Sui", symbol: "SUI",
    family: ChainFamily.SUI, decimals: 9,
    rpcUrls: ["https://fullnode.mainnet.sui.io"],
    blockExplorerUrls: ["https://explorer.sui.io"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "SUI", symbol: "SUI", decimals: 9 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.MOVE_VM, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.APTOS]: {
    chainId: ChainId.APTOS, name: "Aptos", symbol: "APT",
    family: ChainFamily.APTOS, decimals: 8,
    rpcUrls: ["https://fullnode.mainnet.aptoslabs.com"],
    blockExplorerUrls: ["https://explorer.aptoslabs.com"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "APT", symbol: "APT", decimals: 8 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.MOVE_VM, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.NEAR]: {
    chainId: ChainId.NEAR, name: "NEAR Protocol", symbol: "NEAR",
    family: ChainFamily.NEAR, decimals: 24,
    rpcUrls: ["https://rpc.mainnet.near.org"],
    blockExplorerUrls: ["https://explorer.near.org"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "NEAR", symbol: "NEAR", decimals: 24 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.WAMS, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.TON]: {
    chainId: ChainId.TON, name: "TON", symbol: "TON",
    family: ChainFamily.TON, decimals: 9,
    rpcUrls: ["https://toncenter.com/api/v2/jsonRPC"],
    blockExplorerUrls: ["https://tonscan.org"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "TON", symbol: "TON", decimals: 9 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.TRON]: {
    chainId: ChainId.TRON, name: "TRON", symbol: "TRX",
    family: ChainFamily.TRON, decimals: 6,
    rpcUrls: ["https://api.trongrid.io"],
    blockExplorerUrls: ["https://tronscan.org"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "TRX", symbol: "TRX", decimals: 6 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.DELEGATED_POS],
  },
  [ChainId.BITCOIN]: {
    chainId: ChainId.BITCOIN, name: "Bitcoin", symbol: "BTC",
    family: ChainFamily.BITCOIN, decimals: 8,
    rpcUrls: ["https://blockchain.info"],
    blockExplorerUrls: ["https://blockstream.info"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 8 },
    features: [ChainFeature.PROOF_OF_WORK],
  },
  [ChainId.LINEA]: {
    chainId: ChainId.LINEA, name: "Linea", symbol: "ETH",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://rpc.linea.build"],
    blockExplorerUrls: ["https://lineascan.build"],
    testnet: false, layer: "L2",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.ZK_PROOFS],
    parentChain: ChainId.ETHEREUM,
  },
  [ChainId.SCROLL]: {
    chainId: ChainId.SCROLL, name: "Scroll", symbol: "ETH",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://rpc.scroll.io"],
    blockExplorerUrls: ["https://scrollscan.com"],
    testnet: false, layer: "L2",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.ZK_PROOFS],
    parentChain: ChainId.ETHEREUM,
  },
  [ChainId.ZKSYNC]: {
    chainId: ChainId.ZKSYNC, name: "zkSync Era", symbol: "ETH",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://mainnet.era.zksync.io"],
    blockExplorerUrls: ["https://explorer.zksync.io"],
    testnet: false, layer: "L2",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.ZK_PROOFS, ChainFeature.ERC4337, ChainFeature.NATIVE_ACCOUNT_ABSTRACTION],
    parentChain: ChainId.ETHEREUM,
  },
  [ChainId.MANTLE]: {
    chainId: ChainId.MANTLE, name: "Mantle", symbol: "MNT",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://rpc.mantle.xyz"],
    blockExplorerUrls: ["https://explorer.mantle.xyz"],
    testnet: false, layer: "L2",
    nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.OPTIMISTIC_ROLLUP],
    parentChain: ChainId.ETHEREUM,
  },
  [ChainId.BLAST]: {
    chainId: ChainId.BLAST, name: "Blast", symbol: "ETH",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://rpc.blast.io"],
    blockExplorerUrls: ["https://blastscan.io"],
    testnet: false, layer: "L2",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    features: [ChainFeature.EIP1559, ChainFeature.ERC4337, ChainFeature.OPTIMISTIC_ROLLUP],
    parentChain: ChainId.ETHEREUM,
  },
  [ChainId.SEI]: {
    chainId: ChainId.SEI, name: "Sei", symbol: "SEI",
    family: ChainFamily.EVM, decimals: 18,
    rpcUrls: ["https://evm-rpc.sei-apis.com"],
    blockExplorerUrls: ["https://seitrace.com"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "SEI", symbol: "SEI", decimals: 18 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.OSMOSIS]: {
    chainId: ChainId.OSMOSIS, name: "Osmosis", symbol: "OSMO",
    family: ChainFamily.COSMOS, decimals: 6,
    rpcUrls: ["https://rpc.osmosis.zone"],
    blockExplorerUrls: ["https://www.mintscan.io/osmosis"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "OSMO", symbol: "OSMO", decimals: 6 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.IBC, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.INJECTIVE]: {
    chainId: ChainId.INJECTIVE, name: "Injective", symbol: "INJ",
    family: ChainFamily.COSMOS, decimals: 18,
    rpcUrls: ["https://sentry.tm.injective.network"],
    blockExplorerUrls: ["https://explorer.injective.network"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "INJ", symbol: "INJ", decimals: 18 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.IBC, ChainFeature.PROOF_OF_STAKE],
  },
  [ChainId.COSMOS]: {
    chainId: ChainId.COSMOS, name: "Cosmos Hub", symbol: "ATOM",
    family: ChainFamily.COSMOS, decimals: 6,
    rpcUrls: ["https://rpc.cosmos.network"],
    blockExplorerUrls: ["https://www.mintscan.io/cosmos"],
    testnet: false, layer: "L1",
    nativeCurrency: { name: "ATOM", symbol: "ATOM", decimals: 6 },
    features: [ChainFeature.PROGRAMMABLE, ChainFeature.IBC, ChainFeature.PROOF_OF_STAKE],
  },
};

export function getChainMetadata(chainId: ChainId): ChainMetadata | undefined {
  return CHAIN_METADATA[chainId];
}

export function getChainsByFamily(family: ChainFamily): ChainMetadata[] {
  return Object.values(CHAIN_METADATA).filter(c => c.family === family);
}

export function getMainnetChains(): ChainMetadata[] {
  return Object.values(CHAIN_METADATA).filter(c => !c.testnet);
}

export function getL2Chains(): ChainMetadata[] {
  return Object.values(CHAIN_METADATA).filter(c => c.layer === "L2");
}
