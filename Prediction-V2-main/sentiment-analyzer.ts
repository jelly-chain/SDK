import type { SignalDirection } from '../types.js';
import { BULLISH_KEYWORDS, BEARISH_KEYWORDS } from '../constants/keywords.js';

export interface SentimentAnalysis {
  score: number;
  direction: SignalDirection;
  magnitude: number;
  keywords: string[];
}

export class SentimentAnalyzer {
  analyze(text: string): SentimentAnalysis {
    const lower = text.toLowerCase();
    const bullish = BULLISH_KEYWORDS.filter((k) => lower.includes(k.toLowerCase()));
    const bearish = BEARISH_KEYWORDS.filter((k) => lower.includes(k.toLowerCase()));
    const score = (bullish.length - bearish.length) / Math.max(1, bullish.length + bearish.length);
    const magnitude = Math.min(1, (bullish.length + bearish.length) / 5);
    const direction: SignalDirection = score > 0.1 ? 'bullish' : score < -0.1 ? 'bearish' : 'neutral';
    return { score: (score + 1) / 2, direction, magnitude, keywords: [...bullish, ...bearish] };
  }

  analyzeMany(texts: string[]): SentimentAnalysis[] {
    return texts.map((t) => this.analyze(t));
  }

  average(analyses: SentimentAnalysis[]): SentimentAnalysis {
    if (analyses.length === 0) return { score: 0.5, direction: 'neutral', magnitude: 0, keywords: [] };
    const avgScore = analyses.reduce((a, b) => a + b.score, 0) / analyses.length;
    const avgMag = analyses.reduce((a, b) => a + b.magnitude, 0) / analyses.length;
    const direction: SignalDirection = avgScore > 0.55 ? 'bullish' : avgScore < 0.45 ? 'bearish' : 'neutral';
    return { score: avgScore, direction, magnitude: avgMag, keywords: [] };
  }
}
