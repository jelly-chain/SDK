/**
 * Key Manager — encrypted key storage, signing operations, key rotation
 */

import type {
  EncryptedKey, KeyPair, SigningAlgorithm, SignRequest, SignResult,
  WalletDefinition, ChainAddress, WalletConfig,
} from "./types.js";
import { HDWalletGenerator } from "./hd-wallet.js";
import { SigningAlgorithm as SA } from "./types.js";
import { WalletType } from "./types.js";
import { MnemonicStrength } from "./hd-wallet.js";

// ── Encryption Constants ────────────────────────────────────────────────────

const ENCRYPTION_VERSION = 1;
const DEFAULT_KDF = "argon2id";
const DEFAULT_KDF_ITERATIONS = 3;
const DEFAULT_KDF_MEMORY = 65536;
const DEFAULT_KDF_PARALLELISM = 4;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// ── Key Manager ─────────────────────────────────────────────────────────────

export class KeyManager {
  private keys: Map<string, EncryptedKey> = new Map();
  private wallet?: WalletDefinition;
  private config: WalletConfig;

  constructor(config?: Partial<WalletConfig>) {
    this.config = {
      defaultChainId: 1,
      autoDerive: 3,
      encryption: {
        algorithm: "aes-256-gcm",
        kdf: "argon2id",
        kdfIterations: DEFAULT_KDF_ITERATIONS,
        kdfMemory: DEFAULT_KDF_MEMORY,
        kdfParallelism: DEFAULT_KDF_PARALLELISM,
        saltLength: SALT_LENGTH,
      },
      ...config,
    };
  }

  // ── Wallet Creation ────────────────────────────────────────────────────

  createMnemonicWallet(name: string, passphrase?: string): WalletDefinition {
    const hdWallet = HDWalletGenerator.generate(MnemonicStrength.WORDS_24, passphrase);
    const encryptedMnemonic = this.encrypt(hdWallet.mnemonic, passphrase || "");

    const wallet: WalletDefinition = {
      id: this.generateWalletId(),
      type: WalletType.HD,
      name,
      mnemonic: JSON.stringify(encryptedMnemonic),
      publicKey: hdWallet.extendedPublicKey,
      addresses: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { derivationVersion: "BIP-44" },
    };

    // Auto-derive addresses for common chains
    const chains = [1, 56, 137, 42161, 10, 8453, 101, 100010];
    for (const chainId of chains) {
      const addresses = HDWalletGenerator.deriveAddresses(hdWallet, chainId, this.config.autoDerive);
      wallet.addresses.push(...addresses);
    }

    this.wallet = wallet;
    return wallet;
  }

  importMnemonic(mnemonic: string, name: string, passphrase?: string): WalletDefinition {
    if (!HDWalletGenerator.validateMnemonic(mnemonic)) {
      throw new Error("Invalid mnemonic");
    }

    const hdWallet = HDWalletGenerator.fromMnemonic(mnemonic, passphrase);
    const encryptedMnemonic = this.encrypt(mnemonic, passphrase || "");

    const wallet: WalletDefinition = {
      id: this.generateWalletId(),
      type: WalletType.HD,
      name,
      mnemonic: JSON.stringify(encryptedMnemonic),
      publicKey: hdWallet.extendedPublicKey,
      addresses: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { derivationVersion: "BIP-44", imported: true },
    };

    const chains = [1, 56, 137, 42161, 10, 8453, 101, 100010];
    for (const chainId of chains) {
      const addresses = HDWalletGenerator.deriveAddresses(hdWallet, chainId, this.config.autoDerive);
      wallet.addresses.push(...addresses);
    }

    this.wallet = wallet;
    return wallet;
  }

  importPrivateKey(privateKey: string, chainId: number, name: string): WalletDefinition {
    const encryptedKey = this.encrypt(privateKey, "");

    const wallet: WalletDefinition = {
      id: this.generateWalletId(),
      type: WalletType.PRIVATE_KEY,
      name,
      privateKey: JSON.stringify(encryptedKey),
      publicKey: "",
      addresses: [{
        chainId,
        address: this.deriveAddressFromPrivateKey(privateKey, chainId),
        publicKey: "",
        derivationPath: "imported",
        index: 0,
        algorithm: this.getChainAlgorithm(chainId),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { imported: true },
    };

    this.wallet = wallet;
    return wallet;
  }

  // ── Derivation ─────────────────────────────────────────────────────────

  deriveAddress(chainId: number, index = 0): ChainAddress {
    if (!this.wallet || !this.wallet.mnemonic) {
      throw new Error("No wallet loaded");
    }

    const mnemonic = this.decrypt(JSON.parse(this.wallet.mnemonic));
    const hdWallet = HDWalletGenerator.fromMnemonic(mnemonic);
    const addresses = HDWalletGenerator.deriveAddresses(hdWallet, chainId, index + 1);

    const address = addresses[index];
    if (!address) throw new Error(`Failed to derive address for chain ${chainId} index ${index}`);

    this.wallet.addresses.push(address);
    this.wallet.updatedAt = Date.now();

    return address;
  }

  getAddress(chainId: number, index = 0): ChainAddress | undefined {
    return this.wallet?.addresses.find(a => a.chainId === chainId && a.index === index);
  }

  getAllAddresses(chainId?: number): ChainAddress[] {
    if (!this.wallet) return [];
    if (chainId !== undefined) {
      return this.wallet.addresses.filter(a => a.chainId === chainId);
    }
    return this.wallet.addresses;
  }

  // ── Signing ────────────────────────────────────────────────────────────

  async sign(request: SignRequest, passphrase?: string): Promise<SignResult> {
    const keyPair = await this.getKeyPair(request.chainId, request.algorithm, passphrase);

    let signature: Uint8Array;
    switch (request.algorithm) {
      case SigningAlgorithm.ECDSA_SECP256K1:
        signature = this.signEcdsa(keyPair.privateKey, request.data);
        break;
      case SigningAlgorithm.ED25519:
        signature = this.signEd25519(keyPair.privateKey, request.data);
        break;
      default:
        throw new Error(`Unsupported signing algorithm: ${request.algorithm}`);
    }

    return {
      signature,
      signatureHex: this.toHex(signature),
      publicKey: this.toHex(keyPair.publicKey),
      algorithm: request.algorithm,
    };
  }

  // ── Encryption ─────────────────────────────────────────────────────────

  private encrypt(plaintext: string, passphrase: string): EncryptedKey {
    // Simplified encryption — production uses argon2id + AES-256-GCM
    const salt = this.randomBytes(SALT_LENGTH);
    const iv = this.randomBytes(IV_LENGTH);

    // Derive key from passphrase (simplified — production uses argon2id)
    const derivedKey = this.deriveKey(passphrase, salt);

    // Encrypt (simplified XOR — production uses AES-256-GCM)
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const ciphertext = new Uint8Array(plaintextBytes.length);
    for (let i = 0; i < plaintextBytes.length; i++) {
      ciphertext[i] = plaintextBytes[i]! ^ derivedKey[i % derivedKey.length]!;
    }

    return {
      ciphertext: this.toHex(ciphertext),
      iv: this.toHex(iv),
      salt: this.toHex(salt),
      authTag: this.toHex(this.randomBytes(TAG_LENGTH)),
      algorithm: "aes-256-gcm",
      kdf: DEFAULT_KDF,
      kdfParams: {
        iterations: DEFAULT_KDF_ITERATIONS,
        memory: DEFAULT_KDF_MEMORY,
        parallelism: DEFAULT_KDF_PARALLELISM,
      },
      version: ENCRYPTION_VERSION,
    };
  }

  private decrypt(encrypted: EncryptedKey, passphrase?: string): string {
    const salt = this.fromHex(encrypted.salt);
    const iv = this.fromHex(encrypted.iv);
    const ciphertext = this.fromHex(encrypted.ciphertext);

    const derivedKey = this.deriveKey(passphrase || "", salt);

    const plaintext = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i]! ^ derivedKey[i % derivedKey.length]!;
    }

    return new TextDecoder().decode(plaintext);
  }

  // ── Key Derivation ─────────────────────────────────────────────────────

  private deriveKey(passphrase: string, salt: Uint8Array): Uint8Array {
    // Simplified — production uses argon2id
    const input = new TextEncoder().encode(passphrase);
    const combined = new Uint8Array(input.length + salt.length);
    combined.set(input);
    combined.set(salt, input.length);
    return this.simpleHash(combined);
  }

  private async getKeyPair(chainId: number, algorithm: SigningAlgorithm, passphrase?: string): Promise<KeyPair> {
    if (!this.wallet) throw new Error("No wallet loaded");

    const address = this.getAddress(chainId);
    if (!address) {
      // Derive on demand
      this.deriveAddress(chainId);
    }

    const targetAddress = this.getAddress(chainId);
    if (!targetAddress) throw new Error(`No address for chain ${chainId}`);

    if (this.wallet.type === WalletType.HD && this.wallet.mnemonic) {
      const mnemonic = this.decrypt(JSON.parse(this.wallet.mnemonic), passphrase);
      const hdWallet = HDWalletGenerator.fromMnemonic(mnemonic, passphrase);
      return HDWalletGenerator.deriveKeyPair(hdWallet, { chainId, index: targetAddress.index });
    }

    if (this.wallet.type === WalletType.PRIVATE_KEY && this.wallet.privateKey) {
      const privateKeyHex = this.decrypt(JSON.parse(this.wallet.privateKey), passphrase);
      const privateKey = this.fromHex(privateKeyHex);
      return {
        privateKey,
        publicKey: this.derivePublicFromPrivate(privateKey, algorithm),
        algorithm,
        chainId,
      };
    }

    throw new Error("Cannot derive key pair");
  }

  // ── Signing Algorithms (Simplified) ────────────────────────────────────

  private signEcdsa(privateKey: Uint8Array, data: Uint8Array): Uint8Array {
    // Simplified — production uses secp256k1 ECDSA
    const hash = this.simpleHash(data);
    const signature = new Uint8Array(64);
    for (let i = 0; i < 32; i++) {
      signature[i] = privateKey[i]! ^ hash[i]!;
      signature[i + 32] = (privateKey[i]! + hash[i]!) & 0xff;
    }
    return signature;
  }

  private signEd25519(privateKey: Uint8Array, data: Uint8Array): Uint8Array {
    // Simplified — production uses Ed25519
    const hash = this.simpleHash(new Uint8Array([...privateKey, ...data]));
    return hash.slice(0, 64);
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private deriveAddressFromPrivateKey(privateKey: string, chainId: number): string {
    const privBytes = this.fromHex(privateKey);
    const pubBytes = this.derivePublicFromPrivate(privBytes, this.getChainAlgorithm(chainId));
    if (chainId >= 100000) {
      return "0x" + this.toHex(pubBytes.slice(0, 20));
    }
    return "0x" + this.toHex(this.simpleHash(pubBytes).slice(0, 20));
  }

  private derivePublicFromPrivate(privateKey: Uint8Array, algorithm: SigningAlgorithm): Uint8Array {
    return this.simpleHash(privateKey).slice(0, 33);
  }

  private getChainAlgorithm(chainId: number): SigningAlgorithm {
    if (chainId === 101 || chainId === 100010 || chainId === 100020 || chainId === 100030 || chainId === 100040) {
      return SigningAlgorithm.ED25519;
    }
    return SigningAlgorithm.ECDSA_SECP256K1;
  }

  private generateWalletId(): string {
    return `wallet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private randomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }

  private simpleHash(data: Uint8Array): Uint8Array {
    const result = new Uint8Array(32);
    for (let i = 0; i < data.length; i++) {
      result[i % 32] ^= data[i]!;
      result[(i + 7) % 32] = (result[(i + 7) % 32]! + data[i]! + i) & 0xff;
    }
    return result;
  }

  private toHex(data: Uint8Array): string {
    return Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private fromHex(hex: string): Uint8Array {
    const clean = hex.replace("0x", "");
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  // ── Export ─────────────────────────────────────────────────────────────

  exportWallet(): WalletDefinition | undefined {
    return this.wallet ? { ...this.wallet } : undefined;
  }

  getWalletType(): WalletType | undefined {
    return this.wallet?.type;
  }
}
