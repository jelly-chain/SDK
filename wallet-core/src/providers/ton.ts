// wallet-core/src/providers/ton.ts
// TON wallet provider — Ed25519, user-friendly addresses

import * as bip39 from 'bip39';
import { Wallet, CreateWalletOptions, DeriveOptions } from '../types.js';
import { SolSigner } from '../signing.js';

export class TonProvider {
  private signer = new SolSigner();

  async createWallet(options?: CreateWalletOptions): Promise<Wallet> {
    const mnemonic = options?.mnemonic || bip39.generateMnemonic(256);
    const seed = (await bip39.mnemonicToSeed(mnemonic)).slice(0, 32);
    return {
      chain: 'ton',
      mnemonic,
      path: "m/44'/607'/0'/0'/0'",
      privateKey: seed,
      publicKey: seed.slice(0, 32),
      address: this.deriveUserFriendlyAddress(seed.slice(0, 32)),
      index: options?.index ?? 0,
    };
  }

  async importWallet(mnemonic: string, path?: string): Promise<Wallet> {
    const seed = (await bip39.mnemonicToSeed(mnemonic)).slice(0, 32);
    return {
      chain: 'ton',
      mnemonic,
      path: path || "m/44'/607'/0'/0'/0'",
      privateKey: seed,
      publicKey: seed.slice(0, 32),
      address: this.deriveUserFriendlyAddress(seed.slice(0, 32)),
      index: 0,
    };
  }

  async deriveAccount(wallet: Wallet, options: DeriveOptions): Promise<Wallet> {
    const seed = (await bip39.mnemonicToSeed(wallet.mnemonic)).slice(0, 32);
    const derived = new Uint8Array(32);
    for (let i = 0; i < 32; i++) derived[i] = seed[i] ^ (options.index & 0xff);
    return {
      ...wallet,
      path: `m/44'/607'/0'/0'/${options.index}`,
      privateKey: derived,
      publicKey: derived.slice(0, 32),
      address: this.deriveUserFriendlyAddress(derived.slice(0, 32)),
      index: options.index,
    };
  }

  async signTransaction(wallet: Wallet, tx: Parameters<SolSigner['signTransaction']>[1]): Promise<string> {
    return this.signer.signTransaction(wallet.privateKey, tx);
  }

  async signMessage(wallet: Wallet, message: string): Promise<string> {
    return this.signer.signMessage(wallet.privateKey, message);
  }

  private deriveUserFriendlyAddress(publicKey: Uint8Array): string {
    // Placeholder: real TON uses CRC16 + base64 encoding
    return Buffer.from(publicKey).toString('base64url').slice(0, 48);
  }
}
