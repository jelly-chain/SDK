export enum SentimentSource { SOCIAL = "social", NEWS = "news", ON_CHAIN = "on_chain", FORUM = "forum", INFLUENCER = "influencer" }
export enum SentimentLabel { VERY_BEARISH = "very_bearish", BEARISH = "bearish", NEUTRAL = "neutral", BULLISH = "bullish", VERY_BULLISH = "very_bullish" }
export enum TrendDirection { IMPROVING = "improving", STABLE = "stable", DECLINING = "declining", VOLATILE = "volatile" }

export interface SentimentResult {
  label: SentimentLabel;
  score: number;
  confidence: number;
  sources: SentimentSource[];
  keywords: string[];
  entities: { name: string; type: string; sentiment: number }[];
  timestamp: number;
  text: string;
}

export interface SentimentAggregate {
  token: string;
  overall: SentimentLabel;
  score: number;
  confidence: number;
  volume: number;
  breakdown: Record<SentimentSource, { score: number; volume: number; confidence: number }>;
  bullishPercent: number;
  bearishPercent: number;
  neutralPercent: number;
  change1h: number;
  change24h: number;
  fearGreedIndex?: number;
  timestamp: number;
}

export interface SentimentTrend {
  token: string;
  direction: TrendDirection;
  dataPoints: { timestamp: number; score: number; volume: number }[];
  movingAverage7d: number;
  movingAverage30d: number;
  volatility: number;
  momentum: number;
  support: number[];
  resistance: number[];
  divergence: { type: "bullish" | "bearish" | "none"; strength: number };
}

export interface NarrativeAnalysis {
  narrative: string;
  strength: number;
  tokens: string[];
  sentiment: number;
  relatedNarratives: string[];
  sources: number;
  change7d: number;
  peakTimestamp?: number;
}

export interface FearGreedIndex {
  value: number;
  label: "extreme_fear" | "fear" | "neutral" | "greed" | "extreme_greed";
  components: { name: string; value: number; weight: number }[];
  historical: { timestamp: number; value: number }[];
  timestamp: number;
}
