export interface WalletInfo { address: string; chain: string; balance: string; nonce?: number; }
export interface SignedTransaction { raw: string; hash: string; signature: string; }
