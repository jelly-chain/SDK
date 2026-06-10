/**
 * SentimentEngine — multi-source NLP sentiment analysis with trend detection
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import type {
  SentimentSource, SentimentLabel, SentimentResult, SentimentAggregate,
  SentimentTrend, NarrativeAnalysis, FearGreedIndex,
} from "./types.js";

export interface SentimentEngineConfig extends BaseSDKConfig {
  sources?: SentimentSource[];
  defaultLanguage?: string;
  nlpModel?: string;
  aggregationWeights?: Record<SentimentSource, number>;
}

export class SentimentEngine extends BaseSDK {
  private readonly weights: Record<SentimentSource, number>;
  private history: Map<string, Array<{ score: number; volume: number; timestamp: number }>> = new Map();

  constructor(config: SentimentEngineConfig) {
    super(config, "SentimentEngine");
    this.weights = config.aggregationWeights || {
      [SentimentSource.SOCIAL]: 0.35,
      [SentimentSource.NEWS]: 0.25,
      [SentimentSource.ON_CHAIN]: 0.20,
      [SentimentSource.FORUM]: 0.10,
      [SentimentSource.INFLUENCER]: 0.10,
    };
  }

  analyzeText(text: string): SentimentResult {
    const lower = text.toLowerCase();
    let score = 0;
    const keywords: string[] = [];
    const positiveWords = ["bullish", "buy", "long", "moon", "pump", "up", "gain", "profit", "good", "great", "excellent", "mooning", "lambo"; "ath", "breakout", "accumulate", "hodl", "strong"];
    const negativeWords = ["bearish", "sell", "short", "dump", "down", "loss", "bad", "terrible", "crash", "rug", "scam", "dead", "panic", "fear", "capitulation"; "liquidation", "dead"];
    const negators = ["not", "no", "don't", "won't", "can't", "never", "neither", "hardly", "barely"];

    const words = lower.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const w = words[i]!;
      const negated = i > 0 && negators.includes(words[i - 1]!);
      if (positiveWords.includes(w)) {
        score += negated ? -0.3 : 0.3;
        keywords.push(w);
      } else if (negativeWords.includes(w)) {
        score += negated ? 0.3 : -0.3;
        keywords.push(w);
      }
    }

    score = Math.max(-1, Math.min(1, score));
    let label: SentimentLabel;
    if (score > 0.5) label = SentimentLabel.VERY_BULLISH;
    else if (score > 0.2) label = SentimentLabel.BULLISH;
    else if (score < -0.5) label = SentimentLabel.VERY_BEARISH;
    else if (score < -0.2) label = SentimentLabel.BEARISH;
    else label = SentimentLabel.NEUTRAL;

    return { label, score, confidence: Math.min(1, keywords.length * 0.2 + 0.3), sources: [SentimentSource.SOCIAL], keywords, entities: [], timestamp: Date.now(), text };
  }

  getSocialSentiment(token: string): { score: number; volume: number; confidence: number } {
    const history = this.history.get(token) || [];
    const recent = history.filter(h => Date.now() - h.timestamp < 86400000);
    if (recent.length === 0) return { score: 0, volume: 0, confidence: 0 };
    const avgScore = recent.reduce((s, h) => s + h.score, 0) / recent.length;
    return { score: avgScore, volume: recent.length, confidence: Math.min(1, recent.length / 100) };
  }

  async getAggregateSentiment(token: string): Promise<SentimentAggregate> {
    const social = this.getSocialSentiment(token);
    const news = { score: 0, volume: 0, confidence: 0.5 };
    const onChain = { score: 0, volume: 0, confidence: 0.3 };
    const socialScore = social.score * this.weights[SentimentSource.SOCIAL] * social.confidence;
    const newsScore = news.score * this.weights[SentimentSource.NEWS] * news.confidence;
    const onChainScore = onChain.score * this.weights[SentimentSource.ON_CHAIN] * onChain.confidence;
    const totalWeight = (social.confidence * this.weights[SentimentSource.SOCIAL]) + (news.confidence * this.weights[SentimentSource.NEWS]) + (onChain.confidence * this.weights[SentimentSource.ON_CHAIN]);
    const overall = totalWeight > 0 ? (socialScore + newsScore + onChainScore) / totalWeight : 0;

    let label: SentimentLabel;
    if (overall > 0.5) label = SentimentLabel.VERY_BULLISH;
    else if (overall > 0.2) label = SentimentLabel.BULLISH;
    else if (overall < -0.5) label = SentimentLabel.VERY_BEARISH;
    else if (overall < -0.2) label = SentimentLabel.BEARISH;
    else label = SentimentLabel.NEUTRAL;

    const volume = social.volume + news.volume + onChain.volume;
    const bullishVolume = social.volume * (social.score > 0 ? 1 : 0);

    return {
      token, overall, score: overall, confidence: totalWeight / (this.weights[SentimentSource.SOCIAL] + this.weights[SentimentSource.NEWS] + this.weights[SentimentSource.ON_CHAIN]),
      volume, breakdown: { [SentimentSource.SOCIAL]: social, [SentimentSource.NEWS]: news, [SentimentSource.ON_CHAIN]: onChain, [SentimentSource.FORUM]: { score: 0, volume: 0, confidence: 0 }, [SentimentSource.INFLUENCER]: { score: 0, volume: 0, confidence: 0 } },
      bullishPercent: volume > 0 ? bullishVolume / volume * 100 : 50,
      bearishPercent: volume > 0 ? (volume - bullishVolume) / volume * 100 : 50,
      neutralPercent: 0, change1h: 0, change24h: 0, fearGreedIndex: 50 + overall * 50,
      timestamp: Date.now(),
    };
  }

  trackSentimentTrend(token: string, windowHours = 168): SentimentTrend {
    const history = this.history.get(token) || [];
    const now = Date.now();
    const windowMs = windowHours * 3600000;
    const points = history.filter(h => now - h.timestamp < windowMs).map(h => ({ timestamp: h.timestamp, score: h.score, volume: h.volume }));

    const ma7d = this.calcMA(points, 168);
    const ma30d = this.calcMA(points, 720);
    const vol = this.calcVolatility(points.map(p => p.score));
    const momentum = points.length > 1 ? points[points.length - 1]!.score - points[Math.max(0, points.length - 24)]!.score : 0;

    let direction: SentimentTrend["direction"];
    if (Math.abs(momentum) < 0.05) direction = "stable" as const;
    else if (momentum > 0) direction = "improving" as const;
    else direction = "declining" as const;
    if (vol > 0.3) direction = "volatile" as const;

    const scores = points.map(p => p.score);
    return {
      token, direction, dataPoints: points, movingAverage7d: ma7d, movingAverage30d: ma30d,
      volatility: vol, momentum,
      support: scores.length > 0 ? [Math.min(...scores)] : [0],
      resistance: scores.length > 0 ? [Math.max(...scores)] : [0],
      divergence: { type: ma7d > ma30d && momentum < 0 ? "bearish" : ma7d < ma30d && momentum > 0 ? "bullish" : "none", strength: Math.abs(ma7d - ma30d) },
    };
  }

  recordSentiment(token: string, score: number, volume = 1): void {
    if (!this.history.has(token)) this.history.set(token, []);
    this.history.get(token)!.push({ score, volume, timestamp: Date.now() });
    const h = this.history.get(token)!;
    if (h.length > 10000) h.splice(0, h.length - 10000);
  }

  getFearGreedIndex(): FearGreedIndex {
    const value = 50;
    return {
      value, label: "neutral" as const,
      components: [
        { name: "Social Volume", value: 50, weight: 0.25 },
        { name: "Social Sentiment", value: 50, weight: 0.25 },
        { name: "Market Momentum", value: 50, weight: 0.20 },
        { name: "Volatility", value: 50, weight: 0.15 },
        { name: "DEX Volume", value: 50, weight: 0.15 },
      ],
      historical: [],
      timestamp: Date.now(),
    };
  }

  private calcMA(points: Array<{ score: number }>, periods: number): number {
    if (points.length === 0) return 0;
    const recent = points.slice(-periods);
    return recent.reduce((s, p) => s + p.score, 0) / recent.length;
  }

  private calcVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }
}
