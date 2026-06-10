export enum SecurityRiskLevel { SAFE = 0, LOW = 1, MEDIUM = 2, HIGH = 3, CRITICAL = 4 }
export enum VulnerabilityType {
  HONEYPOT = "honeypot", UNLIMITED_MINT = "unlimited_mint", OWNER_PRIVILEGE = "owner_privilege",
  PROXY_UPGRADE = "proxy_upgrade", REENTRANCY = "reentrance", FLASH_LOAN = "flash_loAN", FRONT_RUNNING = "front_running",
  TX_ORIGIN = "tx_origin", UNCHECKED_TRANSFER = "unchecked_transfer", INTEGER_OVERFLOW = "integer_overflow",
  DELEGATECALL = "delegatecall", SELFDESTRUCT = "selfdestruct", BURN_ANY = "burn_any",
  BLACKLIST = "blacklist", TRADING_PAUSE = "trading_pause", FEE_CHANGE = "fee_change", ANTI_WHALE = "anti_whale",
  GAS_TOKEN = "gas_token", TIMELOCK_MISSING = "timelock_missing", MULTISIG_MISSING = "multisig_missing",
}

export interface TokenSecurityResult {
  tokenAddress: string;
  chainId: number;
  tokenSymbol: string;
  tokenName: string;
  isContract: boolean;
  contractVerified: boolean;
  compilerVersion?: string;
  riskLevel: SecurityRiskLevel;
  riskScore: number;
  vulnerabilities: VulnerabilityFinding[];
  contractAnalysis: ContractAnalysis;
  liquidityAnalysis: LiquidityAnalysis;
  holderAnalysis: HolderAnalysis;
  tradingAnalysis: TradingAnalysis;
  auditInfo: AuditInfo;
  timestamp: number;
}

export interface VulnerabilityFinding {
  type: VulnerabilityType;
  severity: SecurityRiskLevel;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  references?: string[];
}

export interface ContractAnalysis {
  isProxy: boolean;
  proxyImplementation?: string;
  isMintable: boolean;
  maxMint?: string;
  isPausable: boolean;
  hasOwner: boolean;
  hasMultisig: boolean;
  timelock?: number;
  canChangeTax: boolean;
  canChangeMaxTx: boolean;
  canBlacklist: boolean;
  canBurnAny: boolean;
  canSelfdestruct: boolean;
  dangerousFunctions: string[];
  externalCalls: string[];
  storageLayout: string[];
  sourceCodeLength: number;
  compiler: string;
  optimization: boolean;
  license?: string;
}

export interface LiquidityAnalysis {
  totalLiquidityUsd: number;
  liquidityLocked: boolean;
  lockProvider?: string;
  lockDuration?: number;
  lockExpiry?: number;
  pools: LiquidityPool[];
  liquidityConcentration: number;
  impermanentLossRisk: number;
  depegRisk?: number;
}

export interface LiquidityPool {
  pair: string;
  dex: string;
  liquidityUsd: number;
  volume24h: number;
  fee: number;
  priceImpact1Percent: number;
  reserves: { token0: string; token1: string; reserve0: string; reserve1: string };
}

export interface HolderAnalysis {
  totalHolders: number;
  top10Percent: number;
  top50Percent: number;
  top100Percent: number;
  creatorHoldingPercent: number;
  deadWalletPercent: number;
  exchangeWalletsPercent: number;
  topHolders: Holder[];
  holderDistribution: { range: string; count: number; percent: number }[];
  concentrationRisk: number;
  whaleRisk: number;
  suspiciousActivity: boolean;
}

export interface Holder {
  address: string;
  balance: string;
  percent: number;
  tag?: string; // "creator", "dead", "exchange", "whale", "dex"
  firstTransactionAt?: number;
  isContract: boolean;
}

export interface TradingAnalysis {
  isBuyable: boolean;
  isSellable: boolean;
  buyTax: number;
  sellTax: number;
  effectiveBuyTax: number;
  effectiveSellTax: number;
  maxTxAmount?: string;
  maxWalletAmount?: string;
  antiWhaleEnabled: boolean;
  tradingCooldown: number;
  volume24h: number;
  txCount24h: number;
  uniqueTraders24h: number;
  averageTradeSize: number;
  priceImpact: number;
  slippage: { amount1: number; amount2: number; amount3: number };
  simulationResults?: TradeSimulation;
}

export interface TradeSimulation {
  buyGas: number;
  sellGas: number;
  buyReverts: boolean;
  sellReverts: boolean;
  buyRevertReason?: string;
  sellRevertReason?: string;
  transferTax: number;
  estimatedProfit1Eth: number;
  estimatedProfit10Eth: number;
  honeypotDetected: boolean;
  blockingReason?: string;
}

export interface AuditInfo {
  isAudited: boolean;
  auditFirms: string[];
  auditReports: AuditReport[];
  lastAuditDate?: number;
  auditScore?: number;
}

export interface AuditReport {
  firm: string;
  url: string;
  date: number;
  findings: { severity: string; count: number }[];
  score?: number;
  summary: string;
}

export interface SecurityScanConfig {
  checkHoneypot: boolean;
  checkMintable: boolean;
  checkOwner: boolean;
  checkLiquidity: boolean;
  checkHolders: boolean;
  checkTrading: boolean;
  checkAudit: boolean;
  simulateTrades: boolean;
  minLiquidityUsd: number;
  maxCreatorPercent: number;
  maxTop10Percent: number;
  maxBuyTax: number;
  maxSellTax: number;
}
