// wallet-core/src/providers/sol.ts
// Solana wallet provider

import * as bip39 from 'bip39';
import { Wallet, CreateWalletOptions, DeriveOptions } from '../types.js';
import { SolSigner } from '../signing.js';

export class SolProvider {
  private signer = new SolSigner();

  async createWallet(options?: CreateWalletOptions): Promise<Wallet> {
    const mnemonic = options?.mnemonic || bip39.generateMnemonic(256);
    const seed = (await bip39.mnemonicToSeed(mnemonic)).slice(0, 32);
    // Solana uses ed25519; first 32 bytes of seed = private key
    const publicKey = seed.slice(0, 32); // placeholder: real impl uses ed25519.getPublicKey

    return {
      chain: 'solana',
      mnemonic,
      path: "m/44'/501'/0'",
      privateKey: seed,
      publicKey,
      address: Buffer.from(publicKey).toString('base58'),
      index: options?.index ?? 0,
    };
  }

  async importWallet(mnemonic: string, path?: string): Promise<Wallet> {
    const seed = (await bip39.mnemonicToSeed(mnemonic)).slice(0, 32);
    return {
      chain: 'solana',
      mnemonic,
      path: path || "m/44'/501'/0'",
      privateKey: seed,
      publicKey: seed.slice(0, 32),
      address: Buffer.from(seed.slice(0, 32)).toString('base58'),
      index: 0,
    };
  }

  async deriveAccount(wallet: Wallet, options: DeriveOptions): Promise<Wallet> {
    const seed = (await bip39.mnemonicToSeed(wallet.mnemonic)).slice(0, 32);
    // Solana derivation: skip BIP32, use direct index-based derivation
    const derivedSeed = new Uint8Array(32);
    for (let i = 0; i < 32; i++) derivedSeed[i] = seed[i] ^ (options.index & 0xff);
    return {
      ...wallet,
      path: `m/44'/501'/0'/${options.change ?? 0}/${options.index}`,
      privateKey: derivedSeed,
      publicKey: derivedSeed.slice(0, 32),
      address: Buffer.from(derivedSeed.slice(0, 32)).toString('base58'),
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

// Temporary helper — will be replaced by proper base58
declare global {
  interface BufferConstructor {
    from(data: Uint8Array): { toString(encoding: 'base58'): string };
  }
}
