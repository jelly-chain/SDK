// wallet-core/src/address.ts
// Address validation and formatting for all supported chains

import { AddressValidator, Chain } from './types.js';

// Ethereum/BNB: 0x followed by 40 hex chars
const ETH_RE = /^0x[0-9a-fA-F]{40}$/;

// Bitcoin: legacy P2PKH (1...), P2SH (3...), bech32 (bc1...)
const BTC_LEGACY_RE = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const BTC_BECH32_RE = /^bc1[ac-hj-np-z02-9]{11,71}$/;

// Solana: base58-encoded 32-byte public key (32-44 chars)
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Sui: 0x followed by 64 hex chars
const SUI_RE = /^0x[0-9a-fA-F]{1,64}$/;

// TON: base64 or user-friendly format
const TON_RE = /^[A-Za-z0-9_-]{48,60}$/;

const VALIDATORS: Record<Chain, AddressValidator> = {
  ethereum: (addr: string) => ETH_RE.test(addr),
  bnb: (addr: string) => ETH_RE.test(addr),
  bitcoin: (addr: string) => BTC_LEGACY_RE.test(addr) || BTC_BECH32_RE.test(addr),
  solana: (addr: string) => SOL_RE.test(addr),
  sui: (addr: string) => SUI_RE.test(addr),
  ton: (addr: string) => TON_RE.test(addr),
};

export class AddressUtils {
  /**
   * Validate an address for a given chain.
   */
  static validate(chain: Chain, address: string): boolean {
    const validator = VALIDATORS[chain];
    if (!validator) throw new Error(`Unsupported chain: ${chain}`);
    return validator(address);
  }

  /**
   * Get the address prefix for a chain.
   */
  static getPrefix(chain: Chain): string {
    const prefixes: Record<Chain, string> = {
      ethereum: '0x',
      bnb: '0x',
      solana: '',
      bitcoin: '',
      sui: '0x',
      ton: '',
    };
    return prefixes[chain];
  }

  /**
   * Normalize an address (lowercase for EVM, etc.)
   */
  static normalize(chain: Chain, address: string): string {
    if (chain === 'ethereum' || chain === 'bnb' || chain === 'sui') {
      // Keep 0x prefix, lowercase hex body
      return address.slice(0, 2) + address.slice(2).toLowerCase();
    }
    return address;
  }

  /**
   * Truncate an address for display: 0x1234...5678
   */
  static truncate(address: string, chars = 4): string {
    if (address.length <= chars * 2 + 3) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }
}
