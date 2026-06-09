// wallet-core/src/derivation.ts
// BIP32/44 HD wallet derivation paths

import { Chain, DeriveOptions, WALLET_CONFIGS } from './types.js';

const BIP44_RE = /^m\/44'\/(\d+)'\/(\d+)'(?:\/(\d+)(?:\/(\d+))?)?$/;

export class DerivationPathParser {
  /**
   * Parse a BIP44 derivation path into its components.
   * Format: m / purpose' / coin_type' / account' / change / address_index
   */
  static parse(path: string): {
    purpose: number;
    coinType: number;
    account: number;
    change: number;
    index: number;
  } {
    const match = path.match(BIP44_RE);
    if (!match) {
      throw new Error(`Invalid BIP44 derivation path: ${path}`);
    }
    return {
      purpose: parseInt(match[1], 10),
      coinType: parseInt(match[2], 10),
      account: parseInt(match[3], 10),
      change: match[4] ? parseInt(match[4], 10) : 0,
      index: match[5] ? parseInt(match[5], 10) : 0,
    };
  }

  /**
   * Build a derivation path for a given chain and options.
   */
  static build(chain: Chain, options?: DeriveOptions): string {
    const config = WALLET_CONFIGS[chain];
    const parsed = this.parse(config.path);
    if (options) {
      parsed.index = options.index;
      if (options.change !== undefined) {
        parsed.change = options.change;
      }
    }
    return `m/44'/${parsed.coinType}'/${parsed.account}'/${parsed.change}/${parsed.index}`;
  }

  /**
   * Get the coin type for a chain (BIP44 registered coin types).
   */
  static getCoinType(chain: Chain): number {
    const COIN_TYPES: Record<Chain, number> = {
      bitcoin: 0,
      ethereum: 60,
      solana: 501,
      bnb: 714,
      sui: 784,
      ton: 607,
    };
    return COIN_TYPES[chain];
  }

  /**
   * Validate that a derivation path matches the expected pattern for a chain.
   */
  static validateForChain(chain: Chain, path: string): boolean {
    const config = WALLET_CONFIGS[chain];
    const expectedCoin = this.getCoinType(chain);
    try {
      const parsed = this.parse(path);
      return parsed.purpose === 44 && parsed.coinType === expectedCoin;
    } catch {
      return false;
    }
  }

  /**
   * Derive a batch of addresses for an account.
   */
  static deriveBatch(chain: Chain, startIndex: number, count: number, change = 0): string[] {
    const config = WALLET_CONFIGS[chain];
    const coinType = this.getCoinType(chain);
    const paths: string[] = [];
    for (let i = startIndex; i < startIndex + count; i++) {
      paths.push(`m/44'/${coinType}'/0'/${change}/${i}`);
    }
    return paths;
  }
}
