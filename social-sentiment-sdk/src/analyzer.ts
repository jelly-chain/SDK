import type { SocialPost, SentimentResult } from './types.js';

const BULLISH_WORDS = [
  'moon', 'pump', 'bullish', 'buy', 'accumulate', 'hodl', 'breakout',
  'rally', 'surge', 'ATH', 'undervalued', 'gem', 'alpha', 'LFG', 'WAGMI',
  'great', 'amazing', 'incredible', 'dominant', 'clutch', 'elite', 'MVP',
];

const BEARISH_WORDS = [
  'dump', 'crash', 'rug', 'scam', 'bearish', 'sell', 'short',
  'overvalued', 'baghold', 'rekt', 'dead', 'ponzi', 'fraud', 'trash',
  'terrible', 'awful', 'bust', 'washed', 'injured', 'suspended',
];

export class SentimentAnalyzer {
  analyze(text: string): SentimentResult {
    const lower = text.toLowerCase();
    let bullish = 0;
    let bearish = 0;
    const keywords: string[] = [];

    for (const word of BULLISH_WORDS) {
      if (lower.includes(word)) {
        bullish++;
        keywords.push(word);
      }
    }
    for (const word of BEARISH_WORDS) {
      if (lower.includes(word)) {
        bearish++;
        keywords.push(word);
      }
    }

    const total = bullish + bearish;
    const score = total === 0 ? 0 : (bullish - bearish) / total;
    const magnitude = Math.min(1, total / 5);

    return {
      score: Math.round(score * 100) / 100,
      magnitude: Math.round(magnitude * 100) / 100,
      volume: 1,
      direction: score > 0.1 ? 'bullish' : score < -0.1 ? 'bearish' : 'neutral',
      topKeywords: keywords.slice(0, 5),
    };
  }

  analyzeMany(posts: SocialPost[]): SentimentResult {
    if (posts.length === 0) return { score: 0, magnitude: 0, volume: 0, direction: 'neutral', topKeywords: [] };

    let totalScore = 0;
    let totalMagnitude = 0;
    const allKeywords: Record<string, number> = {};

    for (const post of posts) {
      const result = this.analyze(post.content);
      const weight = post.isVerified ? 2 : post.isBot ? 0.1 : 1;
      totalScore += result.score * weight;
      totalMagnitude += result.magnitude;
      for (const kw of result.topKeywords) {
        allKeywords[kw] = (allKeywords[kw] ?? 0) + 1;
      }
    }

    const avgScore = totalScore / posts.length;
    const topKeywords = Object.entries(allKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    return {
      score: Math.round(avgScore * 100) / 100,
      magnitude: Math.round((totalMagnitude / posts.length) * 100) / 100,
      volume: posts.length,
      direction: avgScore > 0.1 ? 'bullish' : avgScore < -0.1 ? 'bearish' : 'neutral',
      topKeywords,
    };
  }

  detectDrama(posts: SocialPost[]): {
    hasDrama: boolean;
    severity: 'low' | 'medium' | 'high';
    details: string[];
  } {
    const dramaKeywords = [
      'trade request', 'unhappy', 'wants out', 'locker room', 'beef', 'feud',
      'suspended', 'arrested', 'DUI', 'controversy', 'scandal', 'holdout',
      'contract dispute', 'fired', 'resigned', 'quit', 'mutiny',
    ];

    const details: string[] = [];
    for (const post of posts) {
      const lower = post.content.toLowerCase();
      for (const keyword of dramaKeywords) {
        if (lower.includes(keyword)) {
          details.push(`Detected "${keyword}" from ${post.author}: "${post.content.slice(0, 80)}..."`);
        }
      }
    }

    return {
      hasDrama: details.length > 0,
      severity: details.length >= 3 ? 'high' : details.length >= 1 ? 'medium' : 'low',
      details,
    };
  }
}
