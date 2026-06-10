/**
 * @jellychain/wallet-core — Multi-chain wallet management SDK
 */

export { HDWalletGenerator, MnemonicStrength, parseDerivationPath, formatDerivationPath, getDerivationPath, DEFAULT_DERIVATION_PATHS } from "./hd-wallet.js";
export { KeyManager } from "./key-manager.js";
export type {
  WalletType, SigningAlgorithm, DerivationPath, ChainDerivationPath,
  WalletDefinition, ChainAddress, HDWallet, KeyPair, EncryptedKey,
  SignRequest, SignResult, TransactionRequest, SignedTransaction,
  TokenTransferRequest, ApproveRequest, WalletBalance, TokenWalletBalance,
  WalletActivity, ActivityTransaction, ActivityTokenTransfer, ActivityNFTTransfer,
  WalletConfig, EncryptionConfig, NonceInfo, QueuedTransaction,
  MessageSignRequest, TypedData, MessageSignResult,
  DeriveOptions,
} from "./types.js";
