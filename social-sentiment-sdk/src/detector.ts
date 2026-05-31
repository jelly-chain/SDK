import type { SocialPost, VolumeSpike, SentimentSignal, SentimentResult } from './types.js';
import { SentimentAnalyzer } from './analyzer.js';

export class VolumeSpikeDetector {
  private baselines: Map<string, number> = new Map();
  private analyzer = new SentimentAnalyzer();

  setBaseline(topic: string, avgDaily: number): void {
    this.baselines.set(topic, avgDaily);
  }

  detectSpike(topic: string, posts: SocialPost[], windowHours: number = 1): VolumeSpike | null {
    const baseline = this.baselines.get(topic) ?? 10;
    const hourlyBaseline = baseline / 24;

    const now = Date.now();
    const windowStart = now - windowHours * 60 * 60 * 1000;
    const recentPosts = posts.filter((p) => new Date(p.timestamp).getTime() >= windowStart);

    const spikeMultiple = recentPosts.length / Math.max(1, hourlyBaseline);
    if (spikeMultiple < 2) return null;

    const sentiment = this.analyzer.analyzeMany(recentPosts);

    return {
      topic,
      platform: posts[0]?.platform ?? 'unknown',
      currentVolume: recentPosts.length,
      baselineVolume: Math.round(hourlyBaseline),
      spikeMultiple: Math.round(spikeMultiple * 10) / 10,
      sentiment,
      timestamp: new Date().toISOString(),
    };
  }

  getSignal(topic: string, posts: SocialPost[]): SentimentSignal {
    const spike = this.detectSpike(topic, posts);
    const sentiment = this.analyzer.analyzeMany(posts);
    const drama = this.analyzer.detectDrama(posts);

    let signal: SentimentSignal['signal'] = 'neutral';
    let confidence = 0.3;

    if (spike && sentiment.direction !== 'neutral') {
      signal = sentiment.direction;
      confidence = Math.min(0.7, 0.4 + spike.spikeMultiple / 10);
    }

    if (drama.hasDrama) {
      signal = 'bearish';
      confidence = Math.min(0.8, confidence + 0.2);
    }

    const details: string[] = [];
    if (spike) details.push(`Volume spike: ${spike.spikeMultiple}x normal`);
    if (sentiment.direction !== 'neutral') details.push(`Sentiment: ${sentiment.direction} (${sentiment.score})`);
    if (drama.hasDrama) details.push(`Drama detected: ${drama.details.length} incident(s)`);

    return {
      topic,
      signal,
      confidence: Math.round(confidence * 100) / 100,
      volumeSpike: !!spike,
      sentimentShift: false,
      details: details.join('. ') || 'No significant signals',
    };
  }
}
