/**
 * Token types — ERC-20, SPL, CW20, and native token definitions
 */

export enum TokenType {
  ERC20 = "erc20",
  ERC721 = "erc721",
  ERC1155 = "erc1155",
  SPL = "spl",
  CW20 = "cw20",
  CW721 = "cw721",
  NATIVE = "native",
  JETTON = "jetton",
  COIN = "coin",
  BTC = "btc",
  RUNE = "rune",
  TRC20 = "trc20",
}

export enum TokenStandard {
  ERC20 = "ERC-20",
  ERC721 = "ERC-721",
  ERC1155 = "ERC-1155",
  SPL = "SPL",
  CW20 = "CW-20",
  CW721 = "CW-721",
  JETTON = "TEP-74",
  COIN = "Coin",
}

export interface TokenRef {
  symbol: string;
  name: string;
  address?: string;
  decimals: number;
  chainId: number;
  standard: TokenStandard;
  logoUrl?: string;
  coingeckoId?: string;
  isStablecoin?: boolean;
  isWrapped?: boolean;
}

export interface TokenBalance {
  token: TokenRef;
  balance: bigint;
  balanceFormatted: string;
  usdPrice?: number;
  usdValue?: number;
  change24h?: number;
}

export interface TokenPrice {
  token: TokenRef;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  fdv: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply?: number;
  lastUpdated: number;
}

export interface TokenSecurity {
  token: TokenRef;
  isHoneypot: boolean;
  isMintable: boolean;
  isBlacklisted: boolean;
  isProxy: boolean;
  hasOwner: boolean;
  canPause: boolean;
  canBurn: boolean;
  buyTax: number;
  sellTax: number;
  maxTxAmount?: number;
  maxWalletAmount?: number;
  liquidityLocked: boolean;
  liquidityLockDuration?: number;
  contractVerified: boolean;
  creatorAddress?: string;
  creatorBalance?: number;
  top10HolderPercent: number;
  riskScore: number; // 0-100, 100 = safest
  warnings: string[];
  lastAudit?: string;
  auditProvider?: string;
}

export interface NFTHoldings {
  token: TokenRef;
  tokenId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  attributes?: NFTAttribute[];
  floorPrice?: number;
  lastSalePrice?: number;
  estimatedValue?: number;
  collection: NFTCollection;
}

export interface NFTCollection {
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  standard: TokenStandard;
  totalSupply: number;
  floorPrice: number;
  volume7d: number;
  volume30d: number;
  holders: number;
  verified: boolean;
}

export interface NFTAttribute {
  traitType: string;
  value: string;
  rarity?: number;
}

export enum StablecoinType {
  FIAT_BACKED = "fiat_backed",
  CRYPTO_BACKED = "crypto_backed",
  ALGORITHMIC = "algorithmic",
  RWA_BACKED = "rwa_backed",
  HYBRID = "hybrid",
}

export interface StablecoinInfo {
  token: TokenRef;
  type: StablecoinType;
  peg: string;
  pegDeviation: number;
  collateralRatio?: number;
  collateralAssets?: TokenRef[];
  apy?: number;
  supply: number;
  depegRisk: number; // 0-100
  auditStatus: string;
  reserves?: ReserveInfo[];
}

export interface ReserveInfo {
  asset: string;
  amount: number;
  value: number;
  percentage: number;
  custodian?: string;
}
