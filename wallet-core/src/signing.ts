// wallet-core/src/signing.ts
// Transaction signing per chain

import { Chain, ChainTransaction, EthTransaction, SolTransaction } from './types.js';

export abstract class Signer {
  abstract signTransaction(privateKey: Uint8Array, tx: ChainTransaction): Promise<string>;
  abstract signMessage(privateKey: Uint8Array, message: string): Promise<string>;
  abstract getPublicKey(privateKey: Uint8Array): Uint8Array;
}

/**
 * EVM (Ethereum, BNB Chain) signer using keccak256.
 */
export class EvmSigner extends Signer {
  async signTransaction(privateKey: Uint8Array, tx: ChainTransaction): Promise<string> {
    const ethTx = tx as EthTransaction;
    // In production: use ethers.js or viem for RLP encoding + EIP-155 signing
    const serialized = JSON.stringify({
      to: ethTx.to,
      value: ethTx.value,
      gasLimit: ethTx.gasLimit,
      maxFeePerGas: ethTx.maxFeePerGas,
      maxPriorityFeePerGas: ethTx.maxPriorityFeePerGas,
      nonce: ethTx.nonce,
      chainId: ethTx.chainId,
    });
    // PLACEHOLDER: real implementation uses secp256k1 ECDSA signing
    return `0x${Buffer.from(serialized).toString('hex')}_signed`;
  }

  async signMessage(privateKey: Uint8Array, message: string): Promise<string> {
    // PLACEHOLDER: EIP-191 / EIP-712 signing
    return `0x${Buffer.from(message).toString('hex')}_signed`;
  }

  getPublicKey(privateKey: Uint8Array): Uint8Array {
    // PLACEHOLDER: secp256k1 point multiplication
    return privateKey; // stub
  }
}

/**
 * Solana signer using ed25519.
 */
export class SolSigner extends Signer {
  async signTransaction(privateKey: Uint8Array, _tx: ChainTransaction): Promise<string> {
    // PLACEHOLDER: production uses @solana/web3.js Transaction.sign()
    return Buffer.from(privateKey).toString('base64') + '_signed';
  }

  async signMessage(privateKey: Uint8Array, message: string): Promise<string> {
    const msgBytes = Buffer.from(message, 'utf-8');
    return Buffer.from(privateKey.slice(0, 32)).toString('base64') + `:${msgBytes.toString('hex')}`;
  }

  getPublicKey(privateKey: Uint8Array): Uint8Array {
    // PLACEHOLDER: ed25519 public key from seed
    return privateKey.slice(0, 32);
  }
}

/**
 * Bitcoin signer using secp256k1.
 */
export class BtcSigner extends Signer {
  async signTransaction(privateKey: Uint8Array, _tx: ChainTransaction): Promise<string> {
    // PLACEHOLDER: production uses bitcoinjs-lib
    return Buffer.from(privateKey).toString('hex') + '_signed';
  }

  async signMessage(privateKey: Uint8Array, message: string): Promise<string> {
    // Bitcoin message signing (BIP-137)
    return Buffer.from(privateKey).toString('hex') + ':' + Buffer.from(message).toString('hex');
  }

  getPublicKey(privateKey: Uint8Array): Uint8Array {
    // PLACEHOLDER: P2WPKH public key hash
    return privateKey;
  }
}

/**
 * Factory to get the right signer for a chain.
 */
export class SignerFactory {
  static getSigner(chain: Chain): Signer {
    switch (chain) {
      case 'ethereum':
      case 'bnb':
        return new EvmSigner();
      case 'solana':
        return new SolSigner();
      case 'bitcoin':
        return new BtcSigner();
      case 'sui':
        // Sui uses ed25519
        return new SolSigner();
      case 'ton':
        // TON uses Ed25519 (RFC 8032)
        return new SolSigner();
      default:
        throw new Error(`No signer for chain: ${chain}`);
    }
  }
}
