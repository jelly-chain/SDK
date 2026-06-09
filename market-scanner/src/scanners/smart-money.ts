import { ScannerSignal, SmartMoneyMetadata } from '../types.js';

export class SmartMoneyScanner {
  private watchedWallets: Map<string, { label: string; totalTrades: number }> = new Map();

  constructor(initialWallets?: { address: string; label: string }[]) {
    if (initialWallets) {
      for (const w of initialWallets) {
        this.watchedWallets.set(w.address.toLowerCase(), { label: w.label, totalTrades: 0 });
      }
    }
  }

  /**
   * Add a wallet to the watchlist.
   */
  addWallet(address: string, label: string): void {
    this.watchedWallets.set(address.toLowerCase(), { label, totalTrades: 0 });
  }

  /**
   * Remove a wallet from the watchlist.
   */
  removeWallet(address: string): void {
    this.watchedWallets.delete(address.toLowerCase());
  }

  /**
   * Process a transaction and detect smart money activity.
   */
  processTransaction(
    chain: string,
    from: string,
    to: string,
    tokenAddress: string,
    tokenSymbol: string,
    amountUsd: number,
    isBuy: boolean
  ): ScannerSignal | null {
    const wallet = this.watchedWallets.get(from.toLowerCase());
    if (!wallet) return null;

    // Only track buys (accumulation), sells are noise
    if (!isBuy) return null;

    wallet.totalTrades++;

    const metadata: SmartMoneyMetadata = {
      walletLabel: wallet.label,
      walletAddress: from,
      action: 'buy',
      amountUsd: amountUsd.toString(),
      isFirstBuy: wallet.totalTrades === 1,
    };

    // Confidence based on amount and wallet history
    const confidence = Math.min(
      (amountUsd / 100000) * 0.5 + (wallet.totalTrades > 5 ? 0.3 : 0.1),
      1
    );

    return {
      id: `sm-${from}-${tokenAddress}-${Date.now()}`,
      type: 'smartMoney',
      chain,
      tokenAddress,
      tokenSymbol,
      timestamp: Date.now(),
      confidence,
      metadata,
    };
  }

  getWatchedWallets(): { address: string; label: string; totalTrades: number }[] {
    return Array.from(this.watchedWallets.entries()).map(([address, data]) => ({
      address,
      ...data,
    }));
  }
}
