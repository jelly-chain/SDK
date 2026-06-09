# @jellychain/wallet-core

> Multi-chain wallet management for the JellyChain SDK ecosystem.

Supports Bitcoin, Ethereum, Solana, BNB Chain, Sui, TON — wallet creation, import, export, BIP32/44 derivation, transaction signing, and address validation.

## Installation

```bash
npm install @jellychain/wallet-core
```

## Quick Start

```typescript
import { WalletManager } from '@jellychain/wallet-core';

const wm = new WalletManager();

// Generate a new wallet on any chain
const ethWallet = await wm.createWallet('ethereum');
console.log(ethWallet.address);
console.log(ethWallet.mnemonic); // save this safely

// Import from mnemonic
const solWallet = await wm.importWallet('solana', 'your mnemonic phrase here');

// Sign a transaction
const signed = await wm.signTransaction('ethereum', {
  to: '0x...',
  value: '1000000000000000000',
  gasLimit: '21000',
  maxFeePerGas: '30000000000',
  nonce: 0,
});
```

## Supported Chains

| Chain | Prefix | Curve | Status |
|---|---|---|---|
| Bitcoin | m/44'/0'/0' | secp256k1 | ✅ |
| Ethereum | m/44'/60'/0' | secp256k1 | ✅ |
| Solana | m/44'/501'/0' | ed25519 | ✅ |
| BNB Chain | m/44'/714'/0' | secp256k1 | ✅ |
| Sui | m/44'/784'/0' | ed25519 | ✅ |
| TON | m/44'/607'/0' | ed25519 | ✅ |

## API

### `WalletManager`

| Method | Description |
|---|---|
| `createWallet(chain, options?)` | Generate new HD wallet |
| `importWallet(chain, mnemonic, path?)` | Import from BIP39 mnemonic |
| `importPrivateKey(chain, privateKey)` | Import raw private key |
| `deriveAccount(chain, index, change?)` | Derive child account by index |
| `signTransaction(chain, tx)` | Chain-specific transaction signing |
| `validateAddress(chain, address)` | Address format validation |
| `exportPrivateKey(wallet)` | Export private key (careful!) |

## License

MIT — JellyChain 🐙
