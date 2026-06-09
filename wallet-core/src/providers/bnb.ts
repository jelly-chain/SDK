// wallet-core/src/providers/bnb.ts
// BNB Chain wallet provider — EVM-compatible, same as Ethereum with different chainId

import { EthProvider } from './eth.js';
import { Wallet, CreateWalletOptions, DeriveOptions } from '../types.js';

export class BnbProvider extends EthProvider {
  async createWallet(options?: CreateWalletOptions): Promise<Wallet> {
    const wallet = await super.createWallet(options);
    return { ...wallet, chain: 'bnb', path: "m/44'/714'/0'/0/0" };
  }

  async importWallet(mnemonic: string, path?: string): Promise<Wallet> {
    const wallet = await super.importWallet(mnemonic, path || "m/44'/714'/0'/0/0");
    return { ...wallet, chain: 'bnb' };
  }

  async deriveAccount(wallet: Wallet, options: DeriveOptions): Promise<Wallet> {
    const derived = await super.deriveAccount(wallet, options);
    return { ...derived, chain: 'bnb', path: `m/44'/714'/0'/${options.change ?? 0}/${options.index}` };
  }
}
