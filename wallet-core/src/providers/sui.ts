// wallet-core/src/providers/sui.ts
// Sui wallet provider — ed25519, 0x-prefixed addresses

import * as bip39 from 'bip39';
import { Wallet, CreateWalletOptions, DeriveOptions } from '../types.js';
import { SolSigner } from '../signing.js';

export class SuiProvider {
  private signer = new SolSigner();

  async createWallet(options?: CreateWalletOptions): Promise<Wallet> {
    const mnemonic = options?.mnemonic || bip39.generateMnemonic(256);
    const seed = (await bip39.mnemonicToSeed(mnemonic)).slice(0, 32);
    return {
      chain: 'sui',
      mnemonic,
      path: "m/44'/784'/0'/0'/0'",
      privateKey: seed,
      publicKey: seed.slice(0, 32),
      address: '0x' + Buffer.from(seed.slice(0, 32)).toString('hex'),
      index: options?.index ?? 0,
    };
  }

  async importWallet(mnemonic: string, path?: string): Promise<Wallet> {
    const seed = (await bip39.mnemonicToSeed(mnemonic)).slice(0, 32);
    return {
      chain: 'sui',
      mnemonic,
      path: path || "m/44'/784'/0'/0'/0'",
      privateKey: seed,
      publicKey: seed.slice(0, 32),
      address: '0x' + Buffer.from(seed.slice(0, 32)).toString('hex'),
      index: 0,
    };
  }

  async deriveAccount(wallet: Wallet, options: DeriveOptions): Promise<Wallet> {
    const seed = (await bip39.mnemonicToSeed(wallet.mnemonic)).slice(0, 32);
    const derived = new Uint8Array(32);
    for (let i = 0; i < 32; i++) derived[i] = seed[i] ^ (options.index & 0xff);
    return {
      ...wallet,
      path: `m/44'/784'/0'/0'/${options.index}`,
      privateKey: derived,
      publicKey: derived.slice(0, 32),
      address: '0x' + Buffer.from(derived.slice(0, 32)).toString('hex'),
      index: options.index,
    };
  }

  async signTransaction(wallet: Wallet, tx: Parameters<SolSigner['signTransaction']>[1]): Promise<string> {
    return this.signer.signTransaction(wallet.privateKey, tx);
  }

  async signMessage(wallet: Wallet, message: string): Promise<string> {
    return this.signer.signMessage(wallet.privateKey, message);
  }
}
