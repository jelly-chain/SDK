// wallet-core/src/types.ts
// Shared types for multi-chain wallet management

export type Chain = 'bitcoin' | 'ethereum' | 'solana' | 'bnb' | 'sui' | 'ton';

export type Curve = 'secp256k1' | 'ed25519';

export interface WalletConfig {
  chain: Chain;
  path: string;
  curve: Curve;
  prefix: string;
  bech32Prefix?: string;
}

export interface Wallet {
  chain: Chain;
  mnemonic: string;
  path: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  address: string;
  index: number;
}

export interface EthTransaction {
  to: string;
  value: string;
  data?: string;
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
  nonce: number;
  chainId: number;
}

export interface BtcTransaction {
  to: string;
  amount: number;
  fee: number;
  inputs: { txid: string; vout: number; value: number }[];
  changeAddress?: string;
}

export interface SolInstruction {
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  programId: string;
  data: Uint8Array;
}

export interface SolTransaction {
  instructions: SolInstruction[];
  recentBlockhash: string;
  feePayer: string;
}

export type ChainTransaction = EthTransaction | BtcTransaction | SolTransaction;

export interface CreateWalletOptions {
  mnemonic?: string;
  index?: number;
  passphrase?: string;
}

export interface DeriveOptions {
  index: number;
  change?: number;
}

export type AddressValidator = (address: string) => boolean;

export const WALLET_CONFIGS: Record<Chain, WalletConfig> = {
  bitcoin: {
    chain: 'bitcoin',
    path: "m/44'/0'/0'/0/0",
    curve: 'secp256k1',
    prefix: '0x',
  },
  ethereum: {
    chain: 'ethereum',
    path: "m/44'/60'/0'/0/0",
    curve: 'secp256k1',
    prefix: '0x',
  },
  solana: {
    chain: 'solana',
    path: "m/44'/501'/0'/0'",
    curve: 'ed25519',
    prefix: '',
  },
  bnb: {
    chain: 'bnb',
    path: "m/44'/714'/0'/0/0",
    curve: 'secp256k1',
    prefix: '0x',
  },
  sui: {
    chain: 'sui',
    path: "m/44'/784'/0'/0'/0'",
    curve: 'ed25519',
    prefix: '0x',
  },
  ton: {
    chain: 'ton',
    path: "m/44'/607'/0'/0'/0'",
    curve: 'ed25519',
    prefix: '',
  },
};
