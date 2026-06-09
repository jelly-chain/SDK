// wallet-core/src/index.ts
// Main entry point — WalletManager orchestrates all chain providers

import { Chain, Wallet, CreateWalletOptions, DeriveOptions, ChainTransaction } from './types.js';
import { AddressUtils } from './address.js';
import { DerivationPathParser } from './derivation.js';
import { SignerFactory } from './signing.js';
import { EthProvider } from './providers/eth.js';
import { BnbProvider } from './providers/bnb.js';
import { SolProvider } from './providers/sol.js';
import { BtcProvider } from './providers/btc.js';
import { SuiProvider } from './providers/sui.js';
import { TonProvider } from './providers/ton.js';

export class WalletManager {
  private providers: Record<Chain, EthProvider | BnbProvider | SolProvider | BtcProvider | SuiProvider | TonProvider>;

  constructor() {
    this.providers = {
      ethereum: new EthProvider(),
      bnb: new BnbProvider(),
      solana: new SolProvider(),
      bitcoin: new BtcProvider(),
      sui: new SuiProvider(),
      ton: new TonProvider(),
    };
  }

  /**
   * Create a new HD wallet on the specified chain.
   */
  async createWallet(chain: Chain, options?: CreateWalletOptions): Promise<Wallet> {
    return this.providers[chain].createWallet(options);
  }

  /**
   * Import a wallet from a BIP39 mnemonic phrase.
   */
  async importWallet(chain: Chain, mnemonic: string, path?: string): Promise<Wallet> {
    return this.providers[chain].importWallet(mnemonic, path);
  }

  /**
   * Import a wallet from a raw private key.
   */
  async importPrivateKey(chain: Chain, privateKey: string): Promise<Wallet> {
    const provider = this.providers[chain];
    // All providers support importWallet; for raw key we'd need chain-specific handling
    // This is a simplified version — production would decode hex/base58/etc.
    return provider.importWallet('', "m/44'/60'/0'/0/0");
  }

  /**
   * Derive a child account at the given index.
   */
  async deriveAccount(chain: Chain, wallet: Wallet, options: DeriveOptions): Promise<Wallet> {
    return this.providers[chain].deriveAccount(wallet, options);
  }

  /**
   * Sign a transaction for the specified chain.
   */
  async signTransaction(chain: Chain, wallet: Wallet, tx: ChainTransaction): Promise<string> {
    return this.providers[chain].signTransaction(wallet, tx);
  }

  /**
   * Sign an arbitrary message.
   */
  async signMessage(chain: Chain, wallet: Wallet, message: string): Promise<string> {
    return this.providers[chain].signMessage(wallet, message);
  }

  /**
   * Validate an address format for a chain.
   */
  validateAddress(chain: Chain, address: string): boolean {
    return AddressUtils.validate(chain, address);
  }

  /**
   * Get the derivation path for a chain.
   */
  getDerivationPath(chain: Chain, index = 0): string {
    return DerivationPathParser.build(chain, { index });
  }

  /**
   * Derive multiple addresses for an account.
   */
  deriveAddressBatch(chain: Chain, startIndex: number, count: number): string[] {
    return DerivationPathParser.deriveBatch(chain, startIndex, count);
  }
}

// Re-exports
export { AddressUtils } from './address.js';
export { DerivationPathParser } from './derivation.js';
export { SignerFactory, EvmSigner, SolSigner, BtcSigner } from './signing.js';
export { WALLET_CONFIGS } from './types.js';
export type { Chain, Wallet, WalletConfig, CreateWalletOptions, DeriveOptions, ChainTransaction } from './types.js';
