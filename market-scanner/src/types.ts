export type ScannerEvent = 'volumeSpike' | 'liquidityChange' | 'smartMoney' | 'newListing' | 'narrative';

export interface ScannerSignal {
  id: string;
  type: ScannerEvent;
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  timestamp: number;
  confidence: number; // 0-1
  metadata: Record<string, unknown>;
}

export interface VolumeSpikeMetadata {
  volume24h: string;
  volumeAvg7d: string;
  spikeMultiplier: number;
  priceChange24h: number;
}

export interface SmartMoneyMetadata {
  walletLabel: string;
  walletAddress: string;
  action: 'buy' | 'sell' | 'accumulate';
  amountUsd: string;
  isFirstBuy: boolean;
}

export interface NewListingMetadata {
  dex: string;
  pair: string;
  initialLiquidityUsd: string;
  blockNumber: number;
}

export interface MarketScannerConfig {
  chains: string[];
  pollIntervalMs?: number;
  volumeSpikeThreshold?: number; // multiplier over average
  minLiquidityUsd?: number;
  smartMoneyWallets?: string[];
  webhookUrl?: string;
}

export interface AlertConfig {
  webhook?: string;
  discord?: string;
  telegram?: { botToken: string; chatId: string };
  minConfidence?: number;
}

export type SignalHandler = (signal: ScannerSignal) => void | Promise<void>;
