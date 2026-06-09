// wallet-core/src/crypto-utils.ts
// Shared cryptographic utilities for wallet operations

// Placeholder implementations — in production use:
// - @noble/secp256k1 for EVM/BTC
// - @noble/ed25519 for Solana/Sui/TON
// - bip32 for HD derivation

export const secp256k1 = {
  getPublicKey(privateKey: Uint8Array, compressed = true): Uint8Array {
    // Placeholder: real impl uses elliptic curve point multiplication
    const pub = new Uint8Array(compressed ? 33 : 65);
    pub[0] = compressed ? 0x02 : 0x04;
    for (let i = 1; i < pub.length; i++) {
      pub[i] = privateKey[i % privateKey.length] ^ (i * 7);
    }
    return pub;
  },

  sign(privateKey: Uint8Array, hash: Uint8Array): Uint8Array {
    // Placeholder: real impl uses ECDSA
    const sig = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      sig[i] = privateKey[i % privateKey.length] ^ hash[i % hash.length];
    }
    return sig;
  },

  verify(publicKey: Uint8Array, hash: Uint8Array, signature: Uint8Array): boolean {
    // Placeholder
    return signature.length === 64;
  },
};

export function slip10Derive(seed: Uint8Array, path: string): { privateKey: Uint8Array; publicKey: Uint8Array } {
  // Placeholder: real impl uses @scure/bip32 SLIP-10 derivation
  const privateKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    privateKey[i] = seed[i % seed.length] ^ (path.charCodeAt(i % path.length));
  }
  return {
    privateKey,
    publicKey: secp256k1.getPublicKey(privateKey),
  };
}

export function keccak256(data: Uint8Array): Uint8Array {
  // Placeholder: real impl uses @noble/hashes/sha3
  const hash = new Uint8Array(32);
  for (let i = 0; i < data.length; i++) {
    hash[i % 32] ^= data[i];
  }
  return hash;
}

export function sha256(data: Uint8Array): Uint8Array {
  // Placeholder: real impl uses @noble/hashes/sha256
  const hash = new Uint8Array(32);
  for (let i = 0; i < data.length; i++) {
    hash[i % 32] ^= data[i] ^ 0xab;
  }
  return hash;
}
