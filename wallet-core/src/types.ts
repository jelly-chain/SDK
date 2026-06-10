/**
 * Wallet Core types — HD derivation, key management, signing, encryption
 */

export enum WalletType {
  HD = "hd",                    // BIP-39 mnemonic HD wallet
  PRIVATE_KEY = "private_key",  // Single private key
  HARDWARE = "hardware",        // Hardware wallet (Ledger, Trezor)
  MULTISIG = "multisig",        // Multi-signature (Safe, Gnosis)
  SMART = "smart",              // ERC-4337 smart account
  MPC = "mpc",                  // MPC wallet (Fireblocks, ZenGo)
  SOCIAL = "social",            // Social login (Passkey, WebAuthn)
  WATCH = "watch",              // Watch-only (no keys)
}

export enum SigningAlgorithm {
  ECDSA_SECP256K1 = "ecdsa_secp256k1",   // ETH, BSC, Polygon, BTC
  ED25519 = "ed25519",                     // Solana, Sui, Aptos, NEAR, TON
  SCHNORR = "schnorr",                     // Bitcoin Taproot
  BLS = "bls",                             // Ethereum staking
  SR25519 = "sr25519",                     // Polkadot, Substrate
}

export enum DerivationPath {
  ETHEREUM = "m/44'/60'/0'/0",
  BSC = "m/44'/60'/0'/0",
  POLYGON = "m/44'/60'/0'/0",
  ARBITRUM = "m/44'/60'/0'/0",
  OPTIMISM = "m/44'/60'/0'/0",
  BASE = "m/44'/60'/0'/0",
  AVALANCHE = "m/44'/60'/0'/0",
  SOLANA = "m/44'/501'",
  SUI = "m/44'/784'/0'/0'",
  APTOS = "m/44'/637'/0'/0'/0'",
  NEAR = "m/44'/397'",
  TON = "m/44'/607'",
  BITCOIN = "m/44'/0'/0'/0",
  BITCOIN_SEGWIT = "m/44'/0'/0'/0",
  BITCOIN_NATIVE_SEGWIT = "m/84'/0'/0'/0",
  TRON = "m/44'/195'/0'/0",
  COSMOS = "m/44'/118'/0'/0",
  OSMOSIS = "m/44'/118'/0'/0",
  INJECTIVE = "m/44'/60'/0'/0",
  LINEA = "m/44'/60'/0'/0",
  SCROLL = "m/44'/60'/0'/0",
  ZKSYNC = "m/44'/60'/0'/0",
  MANTLE = "m/44'/60'/0'/0",
  BLAST = "m/44'/60'/0'/0",
  SEI = "m/44'/60'/0'/0",
}

export type ChainDerivationPath = Record<number, DerivationPath | string>;

export interface WalletDefinition {
  id: string;
  type: WalletType;
  name: string;
  description?: string;
  mnemonic?: string; // encrypted
  privateKey?: string; // encrypted
  publicKey: string;
  addresses: ChainAddress[];
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

export interface ChainAddress {
  chainId: number;
  address: string;
  publicKey: string;
  derivationPath: string;
  index: number;
  algorithm: SigningAlgorithm;
}

export interface HDWallet {
  mnemonic: string;
  passphrase?: string;
  seed: Uint8Array;
  rootKey: string;
  extendedPublicKey: string;
  extendedPrivateKey: string;
}

export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  algorithm: SigningAlgorithm;
  chainId: number;
}

export interface EncryptedKey {
  ciphertext: string;
  iv: string;
  salt: string;
  authTag: string;
  algorithm: string;
  kdf: string;
  kdfParams: Record<string, number>;
  version: number;
}

export interface SignRequest {
  chainId: number;
  data: Uint8Array;
  algorithm: SigningAlgorithm;
  encoding?: "hex" | "base64" | "utf8";
}

export interface SignResult {
  signature: Uint8Array;
  signatureHex: string;
  publicKey: string;
  algorithm: SigningAlgorithm;
  recovery?: number; // ECDSA recovery byte
}

export interface TransactionRequest {
  chainId: number;
  from: string;
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  accessList?: { address: string; storageKeys: string[] }[];
  type?: 0 | 1 | 2;
}

export interface SignedTransaction {
  raw: string;
  hash: string;
  from: string;
  to: string;
  value: bigint;
  nonce: number;
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  data: string;
  chainId: number;
  r: string;
  s: string;
  v?: number;
}

export interface TokenTransferRequest {
  chainId: number;
  tokenAddress: string;
  from: string;
  to: string;
  amount: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface ApproveRequest {
  chainId: number;
  tokenAddress: string;
  spender: string;
  amount: bigint;
}

export interface WalletBalance {
  chainId: number;
  address: string;
  nativeBalance: bigint;
  nativeBalanceFormatted: string;
  nativeSymbol: string;
  nativePrice?: number;
  nativeValueUsd?: number;
  tokens: TokenWalletBalance[];
  totalValueUsd?: number;
  blockNumber: number;
  timestamp: number;
}

export interface TokenWalletBalance {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  price?: number;
  valueUsd?: number;
  logoUrl?: string;
  change24h?: number;
}

export interface WalletActivity {
  chainId: number;
  address: string;
  transactions: ActivityTransaction[];
  tokenTransfers: ActivityTokenTransfer[];
  nftTransfers: ActivityNFTTransfer[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ActivityTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasUsed?: bigint;
  gasPrice?: bigint;
  timestamp: number;
  blockNumber: number;
  status: "success" | "failed" | "pending";
  method?: string;
  methodId?: string;
  type: "send" | "receive" | "contract_call" | "contract_deploy" | "token_transfer";
}

export interface ActivityTokenTransfer {
  hash: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  from: string;
  to: string;
  amount: bigint;
  amountFormatted: string;
  timestamp: number;
  blockNumber: number;
  logIndex: number;
  direction: "incoming" | "outgoing";
}

export interface ActivityNFTTransfer {
  hash: string;
  contractAddress: string;
  tokenId: string;
  tokenName?: string;
  from: string;
  to: string;
  timestamp: number;
  blockNumber: number;
  direction: "incoming" | "outgoing";
}

export interface WalletConfig {
  defaultChainId?: number;
  derivationPaths?: ChainDerivationPath;
  encryption?: EncryptionConfig;
  provider?: string;
  autoDerive?: number; // number of addresses to pre-derive
}

export interface EncryptionConfig {
  algorithm: "aes-256-gcm";
  kdf: "argon2id" | "scrypt" | "pbkdf2";
  kdfIterations?: number;
  kdfMemory?: number;
  kdfParallelism?: number;
  saltLength?: number;
}

export interface NonceInfo {
  chainId: number;
  address: string;
  nonce: number;
  pendingNonce: number;
  queuedTransactions: QueuedTransaction[];
}

export interface QueuedTransaction {
  nonce: number;
  hash: string;
  status: "pending" | "queued" | "stuck";
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  sentAt: number;
}

export interface MessageSignRequest {
  chainId: number;
  address: string;
  message: string;
  messageType: "text" | "hex" | "typed_data" | "eip712";
  typedData?: TypedData;
}

export interface TypedData {
  domain: Record<string, string | number>;
  types: Record<string, { name: string; type: string }[]>;
  primaryType: string;
  message: Record<string, unknown>;
}

export interface MessageSignResult {
  signature: string;
  signatureHex: string;
  publicKey: string;
  algorithm: SigningAlgorithm;
  messageHash: string;
}
