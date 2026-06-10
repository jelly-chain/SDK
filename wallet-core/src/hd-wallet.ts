/**
 * HD Wallet — BIP-39 mnemonic, BIP-32/44 derivation, multi-chain key derivation
 */

import type {
  HDWallet, KeyPair, DerivationPath, SigningAlgorithm, ChainAddress,
  ChainDerivationPath, DerivationPath as DerivationPathEnum,
} from "./types.js";

// ── BIP-39 English Wordlist (first 128 for brevity, full 2048 in production) ──
const WORDLIST_STUB = [
  "abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse",
  "access","accident","account","accuse","achieve","acid","acoustic","acquire","across","act",
  "action","actor","actress","actual","adapt","add","addict","address","adjust","admit",
  "adult","advance","advice","aerobic","affair","afford","afraid","again","age","agent",
  "agree","ahead","aim","air","airport","aisle","alarm","album","alcohol","alert",
  "alien","all","alley","allow","almost","alone","alpha","already","also","alter",
  "always","amateur","amazing","among","amount","amused","analyst","anchor","ancient","anger",
  "angle","angry","animal","ankle","announce","annual","another","answer","antenna","antique",
  "anxiety","any","apart","apology","appear","apple","approve","april","arch","arctic",
  "area","arena","argue","arm","armed","armor","army","around","arrange","arrest",
  "arrive","arrow","art","artefact","artist","artwork","ask","aspect","assault","asset",
  "assist","assume","asthma","athlete","atom","attack","attend","attitude","attract","auction",
  "audit","august","aunt","author","auto","autumn","average","avocado","avoid","awake",
];

export enum MnemonicStrength {
  WORDS_12 = 128,  // 12 words, 128 bits entropy
  WORDS_15 = 160,  // 15 words
  WORDS_18 = 192,  // 18 words
  WORDS_21 = 224,  // 21 words
  WORDS_24 = 256,  // 24 words, 256 bits entropy
}

export interface DeriveOptions {
  chainId: number;
  index?: number;
  change?: number; // 0 = external, 1 = change
  customPath?: string;
}

// ── HD Path Parser ──────────────────────────────────────────────────────────

export function parseDerivationPath(path: string): { purpose: number; coinType: number; account: number; change: number; index: number } {
  const parts = path.replace(/'/g, "").split("/").slice(1);
  return {
    purpose: parseInt(parts[0]!),
    coinType: parseInt(parts[1]!),
    account: parseInt(parts[2]!),
    change: parseInt(parts[3] ?? "0"),
    index: parseInt(parts[4] ?? "0"),
  };
}

export function formatDerivationPath(purpose: number, coinType: number, account: number, change: number, index: number): string {
  return `m/${purpose}'/${coinType}'/${account}'/${change}/${index}`;
}

// ── Chain Derivation Paths ──────────────────────────────────────────────────

export const DEFAULT_DERIVATION_PATHS: ChainDerivationPath = {
  1:     DerivationPathEnum.ETHEREUM,     // Ethereum
  56:    DerivationPathEnum.BSC,          // BSC
  137:   DerivationPathEnum.POLYGON,      // Polygon
  42161: DerivationPathEnum.ARBITRUM,     // Arbitrum
  10:    DerivationPathEnum.OPTIMISM,     // Optimism
  8453:  DerivationPathEnum.BASE,         // Base
  43114: DerivationPathEnum.AVALANCHE,    // Avalanche
  59144: DerivationPathEnum.LINEA,        // Linea
  534352:DerivationPathEnum.SCROLL,       // Scroll
  324:   DerivationPathEnum.ZKSYNC,       // zkSync
  5000:  DerivationPathEnum.MANTLE,       // Mantle
  81457: DerivationPathEnum.BLAST,        // Blast
  100002:DerivationPathEnum.SEI,          // Sei (EVM)
  101:   DerivationPathEnum.SOLANA,       // Solana
  100010:DerivationPathEnum.SUI,          // Sui
  100020:DerivationPathEnum.APTOS,        // Aptos
  100030:DerivationPathEnum.NEAR,         // NEAR
  100040:DerivationPathEnum.TON,          // TON
  100050:DerivationPathEnum.TRON,         // TRON
  100060:DerivationPathEnum.BITCOIN,     // Bitcoin
  100011:DerivationPathEnum.OSMOSIS,      // Osmosis
  100012:DerivationPathEnum.INJECTIVE,    // Injective
  100013:DerivationPathEnum.COSMOS,       // Cosmos
};

export function getDerivationPath(chainId: number, index = 0, account = 0, change = 0): string {
  const basePath = DEFAULT_DERIVATION_PATHS[chainId];
  if (!basePath) {
    // Default EVM path for unknown chains
    return formatDerivationPath(44, chainId > 100000 ? chainId - 100000 : chainId, account, change, index);
  }

  const parsed = parseDerivationPath(basePath);
  return formatDerivationPath(parsed.purpose, parsed.coinType, parsed.account, change, index);
}

// ── HD Wallet Generator ─────────────────────────────────────────────────────

export class HDWalletGenerator {
  /**
   * Generate a new HD wallet with BIP-39 mnemonic.
   * NOTE: In production, use crypto.randomBytes for entropy and full 2048-word list.
   * This is a simplified implementation for agent SDK usage.
   */
  static generate(strength: MnemonicStrength = MnemonicStrength.WORDS_12, passphrase?: string): HDWallet {
    // Generate mnemonic (simplified — production uses CSPRNG + full wordlist)
    const wordCount = strength === MnemonicStrength.WORDS_12 ? 12 :
      strength === MnemonicStrength.WORDS_15 ? 15 :
      strength === MnemonicStrength.WORDS_18 ? 18 :
      strength === MnemonicStrength.WORDS_21 ? 21 : 24;

    // In production: entropy = crypto.randomBytes(strength / 8)
    // Simplified stub using available wordlist
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(WORDLIST_STUB[i % WORDLIST_STUB.length]!);
    }
    const mnemonic = words.join(" ");

    // Derive seed (simplified — production uses PBKDF2 with 2048 rounds)
    const seed = this.deriveSeed(mnemonic, passphrase);

    // Derive root key (simplified — production uses HMAC-SHA512)
    const rootKey = this.deriveRootKey(seed);

    return {
      mnemonic,
      passphrase,
      seed,
      rootKey,
      extendedPublicKey: this.deriveExtendedPublic(rootKey),
      extendedPrivateKey: this.deriveExtendedPrivate(rootKey),
    };
  }

  static fromMnemonic(mnemonic: string, passphrase?: string): HDWallet {
    const seed = this.deriveSeed(mnemonic, passphrase);
    const rootKey = this.deriveRootKey(seed);
    return {
      mnemonic,
      passphrase,
      seed,
      rootKey,
      extendedPublicKey: this.deriveExtendedPublic(rootKey),
      extendedPrivateKey: this.deriveExtendedPrivate(rootKey),
    };
  }

  /** Derive a key pair for a specific chain and index */
  static deriveKeyPair(wallet: HDWallet, options: DeriveOptions): KeyPair {
    const path = options.customPath || getDerivationPath(options.chainId, options.index || 0);
    return this.deriveFromPath(wallet, path, options.chainId);
  }

  /** Derive multiple addresses for a chain */
  static deriveAddresses(wallet: HDWallet, chainId: number, count = 1): ChainAddress[] {
    const addresses: ChainAddress[] = [];
    for (let i = 0; i < count; i++) {
      const path = getDerivationPath(chainId, i);
      const keyPair = this.deriveFromPath(wallet, path, chainId);
      const address = this.deriveAddress(keyPair, chainId);
      const algorithm = this.getAlgorithm(chainId);
      addresses.push({
        chainId,
        address,
        publicKey: this.toHex(keyPair.publicKey),
        derivationPath: path,
        index: i,
        algorithm,
      });
    }
    return addresses;
  }

  /** Validate a BIP-39 mnemonic */
  static validateMnemonic(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/);
    const validLengths = [12, 15, 18, 21, 24];
    if (!validLengths.includes(words.length)) return false;
    // Simplified — production checks each word against full 2048-word list + checksum
    return words.every(w => w.length >= 2 && /^[a-z]+$/.test(w));
  }

  // ── Private Derivation (Simplified — Production uses proper BIP-32/44) ──────

  private static deriveSeed(mnemonic: string, passphrase?: string): Uint8Array {
    // Production: PBKDF2(SHA-512, mnemonic + "mnemonic" + passphrase, 2048 rounds, 512 bits)
    const input = mnemonic + (passphrase || "");
    return this.simpleHash(Buffer.from(input));
  }

  private static deriveRootKey(seed: Uint8Array): string {
    // Production: HMAC-SHA512(key="Bitcoin message", data=seed)
    return this.toHex(this.simpleHash(seed)).slice(0, 128);
  }

  private static deriveExtendedPrivate(rootKey: string): string {
    return "xprv" + rootKey;
  }

  private static deriveExtendedPublic(rootKey: string): string {
    return "xpub" + rootKey.slice(32);
  }

  private static deriveFromPath(wallet: HDWallet, path: string, chainId: number): KeyPair {
    const parsed = parseDerivationPath(path);
    const chainFamily = this.getChainFamily(chainId);

    // Simplified derivation — production uses proper BIP-32 CKD
    const input = wallet.rootKey + path;
    const hash = this.simpleHash(Buffer.from(input));

    return {
      privateKey: hash.slice(0, 32),
      publicKey: this.derivePublicFromPrivate(hash.slice(0, 32), chainFamily),
      algorithm: this.getAlgorithm(chainId),
      chainId,
    };
  }

  private static deriveAddress(keyPair: KeyPair, chainId: number): string {
    const family = this.getChainFamily(chainId);
    switch (family) {
      case "evm":
        return this.deriveEvmAddress(keyPair.publicKey);
      case "solana":
        return this.toBase58(keyPair.publicKey);
      case "sui":
        return this.deriveSuiAddress(keyPair.publicKey);
      case "aptos":
        return this.deriveAptosAddress(keyPair.publicKey);
      case "bitcoin":
        return this.deriveBtcAddress(keyPair.publicKey);
      case "ton":
        return this.deriveTonAddress(keyPair.publicKey);
      case "cosmos":
        return this.deriveCosmosAddress(keyPair.publicKey);
      case "near":
        return this.deriveNearAddress(keyPair.publicKey);
      case "tron":
        return this.deriveTronAddress(keyPair.publicKey);
      default:
        return "0x" + this.toHex(keyPair.publicKey);
    }
  }

  // ── Address Derivation (Simplified) ────────────────────────────────────────

  private static deriveEvmAddress(publicKey: Uint8Array): string {
    // Production: keccak256(uncompressed_pubkey_bytes[1:])[12:]
    const hash = this.simpleHash(publicKey.slice(0, 33));
    return "0x" + this.toHex(hash.slice(0, 20));
  }

  private static deriveSuiAddress(publicKey: Uint8Array): string {
    const hash = this.simpleHash(publicKey);
    return "0x" + this.toHex(hash.slice(0, 32));
  }

  private static deriveAptosAddress(publicKey: Uint8Array): string {
    const hash = this.simpleHash(publicKey);
    return "0x" + this.toHex(hash.slice(0, 32));
  }

  private static deriveBtcAddress(publicKey: Uint8Array): string {
    const hash = this.simpleHash(publicKey);
    return "1" + this.toHex(hash.slice(0, 20)).replace(/(.{4})/g, "$1").trim();
  }

  private static deriveTonAddress(publicKey: Uint8Array): string {
    const hash = this.simpleHash(publicKey);
    return "UQ" + this.toHex(hash.slice(0, 32));
  }

  private static deriveCosmosAddress(publicKey: Uint8Array): string {
    const hash = this.simpleHash(publicKey);
    return "cosmos1" + this.toBech32(hash.slice(0, 20));
  }

  private static deriveNearAddress(publicKey: Uint8Array): string {
    return this.toHex(publicKey.slice(0, 32)) + ".near";
  }

  private static deriveTronAddress(publicKey: Uint8Array): string {
    const hash = this.simpleHash(publicKey);
    return "T" + this.toHex(hash.slice(0, 20)).replace(/(.{4})/g, "$1").trim();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private static getChainFamily(chainId: number): string {
    if (chainId >= 100000) {
      if (chainId === 101) return "solana";
      if (chainId === 100010) return "sui";
      if (chainId === 100020) return "aptos";
      if (chainId === 100030) return "near";
      if (chainId === 100040) return "ton";
      if (chainId === 100050) return "tron";
      if (chainId === 100060) return "bitcoin";
      if (chainId === 100011) return "cosmos";
      if (chainId === 100012) return "cosmos";
      if (chainId === 100013) return "cosmos";
      return "evm";
    }
    return "evm";
  }

  private static getAlgorithm(chainId: number): SigningAlgorithm {
    const family = this.getChainFamily(chainId);
    switch (family) {
      case "solana":
      case "sui":
      case "aptos":
      case "near":
      case "ton":
        return SigningAlgorithm.ED25519;
      case "bitcoin":
        return SigningAlgorithm.ECDSA_SECP256K1;
      default:
        return SigningAlgorithm.ECDSA_SECP256K1;
    }
  }

  private static derivePublicFromPrivate(privateKey: Uint8Array, family: string): Uint8Array {
    // Simplified — production uses proper curve multiplication
    return this.simpleHash(privateKey).slice(0, 33);
  }

  private static simpleHash(data: Uint8Array): Uint8Array {
    // Simplified hash — production uses keccak256/sha256/sha512
    const result = new Uint8Array(32);
    for (let i = 0; i < data.length; i++) {
      result[i % 32] ^= data[i]!;
      result[(i + 7) % 32] = (result[(i + 7) % 32]! + data[i]! + i) & 0xff;
    }
    return result;
  }

  private static toHex(data: Uint8Array): string {
    return Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private static toBase58(data: Uint8Array): string {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    let num = BigInt("0x" + this.toHex(data));
    const base = BigInt(58);
    while (num > 0n) {
      result = ALPHABET[Number(num % base)] + result;
      num /= base;
    }
    return result || "1";
  }

  private static toBech32(data: Uint8Array): string {
    const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    let result = "";
    for (const byte of data) {
      result += CHARSET[byte % 32];
    }
    return result;
  }
}
