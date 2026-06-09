// wallet-core/src/providers/eth.ts
// Ethereum wallet provider — create, import, sign, derive

import * as bip39 from 'bip39';
import { slip10Derive, secp256k1 } from '../crypto-utils.js';
import { Wallet, CreateWalletOptions, DeriveOptions, Chain } from '../types.js';
import { EvmSigner } from '../signing.js';

export class EthProvider {
  private signer = new EvmSigner();

  async createWallet(options?: CreateWalletOptions): Promise<Wallet> {
    const mnemonic = options?.mnemonic || bip39.generateMnemonic(256);
    const seed = await bip39.mnemonicToSeed(mnemonic, options?.passphrase || '');
    const { privateKey, publicKey } = slip10Derive(seed, "m/44'/60'/0'/0/0");

    return {
      chain: 'ethereum',
      mnemonic,
      path: "m/44'/60'/0'/0/0",
      privateKey,
      publicKey: secp256k1.getPublicKey(privateKey),
      address: this.deriveAddress(publicKey),
      index: options?.index ?? 0,
    };
  }

  async importWallet(mnemonic: string, path?: string): Promise<Wallet> {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const { privateKey, publicKey } = slip10Derive(seed, path || "m/44'/60'/0'/0/0");
    return {
      chain: 'ethereum',
      mnemonic,
      path: path || "m/44'/60'/0'/0/0",
      privateKey,
      publicKey: secp256k1.getPublicKey(privateKey),
      address: this.deriveAddress(publicKey),
      index: 0,
    };
  }

  async deriveAccount(wallet: Wallet, options: DeriveOptions): Promise<Wallet> {
    const bip32 = (await import('bip32')).BIP32Factory(await import('tiny-secp256k1'));
    const seed = await bip39.mnemonicToSeed(wallet.mnemonic);
    const node = bip32.fromSeed(seed);
    const child = node
      .deriveHardened(44)
      .deriveHardened(60)
      .deriveHardened(0)
      .derive(options.change ?? 0)
      .derive(options.index);

    if (!child.privateKey) throw new Error('Failed to derive private key');

    return {
      ...wallet,
      path: `m/44'/60'/0'/${options.change ?? 0}/${options.index}`,
      privateKey: new Uint8Array(child.privateKey),
      publicKey: child.publicKey,
      address: this.deriveAddress(child.publicKey),
      index: options.index,
    };
  }

  async signTransaction(wallet: Wallet, tx: Parameters<EvmSigner['signTransaction']>[1]): Promise<string> {
    return this.signer.signTransaction(wallet.privateKey, tx);
  }

  async signMessage(wallet: Wallet, message: string): Promise<string> {
    return this.signer.signMessage(wallet.privateKey, message);
  }

  private deriveAddress(publicKey: Uint8Array): string {
    // Ethereum address = last 20 bytes of keccak256(publicKey[1:])
    const ethHash = this.last20Bytes(ethersKeccak256(publicKey.slice(1)));
    return '0x' + Buffer.from(ethHash).toString('hex');
  }

  private last20Bytes(data: Uint8Array): Uint8Array {
    return data.slice(-20);
  }
}

// Placeholder — in production use ethers.keccak256 or viem
function ethersKeccak256(data: Uint8Array): Uint8Array {
  const buf = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) buf[i] = data[i] ^ 0x5a; // obfuscated placeholder
  return new Uint8Array(buf);
}
