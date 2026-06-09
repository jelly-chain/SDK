import { EventEmitter } from 'events';
import { MarketScannerConfig, ScannerSignal, SignalHandler, ScannerEvent, AlertConfig } from './types.js';
import { VolumeSpikeScanner } from './scanners/volume-spike.js';
import { NewListingScanner } from './scanners/new-listings.js';
import { SmartMoneyScanner } from './scanners/smart-money.js';
import { LiquidityTracker } from './scanners/liquidity-tracker.js';
import { NarrativeScanner } from './scanners/narrative.js';
import { AlertDispatcher } from './alert.js';

export class MarketScanner extends EventEmitter {
  private config: MarketScannerConfig;
  private running = false;
  private interval?: ReturnType<typeof setInterval>;

  // Sub-scanners
  private volumeScanner: VolumeSpikeScanner;
  private listingScanner: NewListingScanner;
  private smartMoneyScanner: SmartMoneyScanner;
  private liquidityTracker: LiquidityTracker;
  private narrativeScanner: NarrativeScanner;
  private dispatcher: AlertDispatcher;

  constructor(config: MarketScannerConfig, alertConfig?: AlertConfig) {
    super();
    this.config = config;

    this.volumeScanner = new VolumeSpikeScanner(config.volumeSpikeThreshold);
    this.listingScanner = new NewListingScanner();
    this.smartMoneyScanner = new SmartMoneyScanner();
    this.liquidityTracker = new LiquidityTracker();
    this.narrativeScanner = new NarrativeScanner();
    this.dispatcher = new AlertDispatcher(alertConfig || {});
  }

  /**
   * Start all scanners.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.emit('started');

    this.interval = setInterval(() => this.poll(), this.config.pollIntervalMs || 5000);
  }

  /**
   * Stop all scanners.
   */
  stop(): void {
    this.running = false;
    if (this.interval) clearInterval(this.interval);
    this.emit('stopped');
  }

  /**
   * Process a single token data packet through all scanners.
   */
  processToken(data: {
    chain: string;
    tokenAddress: string;
    tokenSymbol: string;
    volume24h: number;
    priceChange24h: number;
    liquidityUsd: number;
    dex: string;
    blockNumber: number;
  }): ScannerSignal[] {
    const signals: ScannerSignal[] = [];

    const vs = this.volumeScanner.analyze(data.tokenAddress, data.volume24h, data.priceChange24h);
    if (vs) signals.push(vs);

    const nl = this.listingScanner.detect(data.chain, data.dex, data.tokenAddress, 'WETH', data.liquidityUsd, data.blockNumber);
    if (nl) signals.push(nl);

    const lq = this.liquidityTracker.record({
      tokenAddress: data.tokenAddress,
      tokenSymbol: data.tokenSymbol,
      dex: data.dex,
      chain: data.chain,
      liquidityUsd: data.liquidityUsd,
      timestamp: Date.now(),
    });
    if (lq) signals.push(lq);

    for (const signal of signals) {
      this.emit(signal.type, signal);
      this.emit('signal', signal);
    }

    return signals;
  }

  /**
   * Process a smart money transaction.
   */
  processSmartMoneyTx(data: {
    chain: string;
    from: string;
    to: string;
    tokenAddress: string;
    tokenSymbol: string;
    amountUsd: number;
    isBuy: boolean;
  }): ScannerSignal | null {
    const signal = this.smartMoneyScanner.processTransaction(
      data.chain, data.from, data.to, data.tokenAddress, data.tokenSymbol, data.amountUsd, data.isBuy
    );
    if (signal) {
      this.emit('smartMoney', signal);
      this.emit('signal', signal);
    }
    return signal;
  }

  /**
   * Add a smart money wallet to track.
   */
  addSmartMoneyWallet(address: string, label: string): void {
    this.smartMoneyScanner.addWallet(address, label);
  }

  /**
   * Dispatch a signal to alert channels.
   */
  async dispatchAlert(signal: ScannerSignal): Promise<void> {
    await this.dispatcher.dispatch(signal);
  }

  on(event: ScannerEvent | 'signal' | 'started' | 'stopped', handler: SignalHandler | (() => void)): this {
    return super.on(event, handler as any);
  }

  private async poll(): Promise<void> {
    // In production: fetch from DEX APIs, on-chain events, etc.
    this.emit('poll', { timestamp: Date.now(), chains: this.config.chains });
  }
}
