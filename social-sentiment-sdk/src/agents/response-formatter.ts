/**
 * Format Social Sentiment data for agent-friendly output
 */

import type { SentimentResult, VolumeSpike, SentimentSignal } from './types.js';

export class ResponseFormatter {
  static formatSentiment(result: SentimentResult, topic: string): string {
    const emoji = result.direction === 'bullish' ? '🟢' : result.direction === 'bearish' ? '🔴' : '⚪';
    const parts: string[] = [];
    parts.push(`${emoji} Sentiment: ${topic}`);
    parts.push(`   Direction: ${result.direction.toUpperCase()}`);
    parts.push(`   Score: ${(result.score * 100).toFixed(0)}%`);
    parts.push(`   Magnitude: ${(result.magnitude * 100).toFixed(0)}%`);
    parts.push(`   Volume: ${result.volume} posts`);

    if (result.topKeywords.length > 0) {
      parts.push(`   Keywords: ${result.topKeywords.join(', ')}`);
    }

    return parts.join('\n');
  }

  static formatSpike(spike: VolumeSpike): string {
    const parts: string[] = [];
    parts.push(`🚨 Volume Spike Detected: ${spike.topic}`);
    parts.push(`   Platform: ${spike.platform}`);
    parts.push(`   Current: ${spike.currentVolume} posts/hour`);
    parts.push(`   Baseline: ${spike.baselineVolume} posts/hour`);
    parts.push(`   Spike: ${spike.spikeMultiple}x normal`);
    parts.push(`   Sentiment: ${spike.sentiment.direction.toUpperCase()}`);
    parts.push(`   Timestamp: ${spike.timestamp}`);

    return parts.join('\n');
  }

  static formatSignal(signal: SentimentSignal): string {
    const emoji = signal.signal === 'bullish' ? '🟢' : signal.signal === 'bearish' ? '🔴' : '⚪';
    const parts: string[] = [];
    parts.push(`${emoji} Social Signal: ${signal.topic}`);
    parts.push(`   Signal: ${signal.signal.toUpperCase()}`);
    parts.push(`   Confidence: ${(signal.confidence * 100).toFixed(0)}%`);
    parts.push(`   Volume Spike: ${signal.volumeSpike ? 'Yes' : 'No'}`);
    parts.push(`   Details: ${signal.details}`);

    return parts.join('\n');
  }

  static formatForPrediction(topic: string, sentiment: SentimentResult, signal?: SentimentSignal): string {
    const parts: string[] = [];
    parts.push(`## Social Sentiment: ${topic}`);
    parts.push(this.formatSentiment(sentiment, topic));

    if (signal) {
      parts.push('\n' + this.formatSignal(signal));
    }

    return parts.join('\n');
  }
}
