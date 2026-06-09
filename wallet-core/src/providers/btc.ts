// wallet-core/src/providers/btc.ts
// Bitcoin wallet provider

import * as bip39 from 'bip39';
import { Wallet, CreateWalletOptions, DeriveOptions } from '../types.js';
import { BtcSigner } from '../signing.js';

export class BtcProvider {
  private signer = new BtcSigner();

  async createWallet(options?: CreateWalletOptions): Promise<Wallet> {
    const mnemonic = options?.mnemonic || bip39.generateMnemonic(256);
    const seed = await bip39.mnemonicToSeed(mnemonic, options?.passphrase || '');
    const privKey = seed.slice(0, 32);

    return {
      chain: 'bitcoin',
      mnemonic,
      path: "m/44'/0'/0'/0/0",
      privateKey: privKey,
      publicKey: privKey, // placeholder: secp256k1
      address: this.deriveP2WPKH(privKey),
      index: options?.index ?? 0,
    };
  }

  async importWallet(mnemonic: string, path?: string): Promise<Wallet> {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const privKey = seed.slice(0, 32);
    return {
      chain: 'bitcoin',
      mnemonic,
      path: path || "m/44'/0'/0'/0/0",
      privateKey: privKey,
      publicKey: privKey,
      address: this.deriveP2WPKH(privKey),
      index: 0,
    };
  }

  async deriveAccount(wallet: Wallet, options: DeriveOptions): Promise<Wallet> {
    const seed = await bip39.mnemonicToSeed(wallet.mnemonic);
    const privKey = seed.slice(0, 32);
    return {
      ...wallet,
      path: `m/44'/0'/0'/${options.change ?? 0}/${options.index}`,
      privateKey: privKey,
      publicKey: privKey,
      address: this.deriveP2WPKH(privKey),
      index: options.index,
    };
  }

  async signTransaction(wallet: Wallet, tx: Parameters<BtcSigner['signTransaction']>[1]): Promise<string> {
    return this.signer.signTransaction(wallet.privateKey, tx);
  }

  async signMessage(wallet: Wallet, message: string): Promise<string> {
    return this.signer.signMessage(wallet.privateKey, message);
  }

  private deriveP2WPKH(privateKey: Uint8Array): string {
    // Placeholder: real impl uses bech32 encoding of HASH160(pubkey)
    const hash = Buffer.from(privateKey).toString('hex').slice(0, 40);
    return `bc1q${hash}`;
  }
}
