import type { EventData, EventMarketSignal } from './types.js';

export class EventAnalyzer {
  /** Analyze event for market signals */
  analyze(event: EventData): EventMarketSignal {
    let signal: EventMarketSignal['signal'] = 'neutral';
    let confidence = 0.3;
    let reason = 'No significant market signal';
    const relatedTokens: string[] = [];

    // Sold-out events
    if (event.status === 'sold-out') {
      signal = 'bullish';
      confidence = 0.6;
      reason = 'Sold-out event indicates high demand';
    }

    // High-capacity venues
    if (event.venue?.capacity && event.venue.capacity > 50000) {
      signal = 'bullish';
      confidence = Math.min(0.7, confidence + 0.1);
      reason = `Large venue (${event.venue.capacity.toLocaleString()} capacity)`;
    }

    // Price anomalies
    if (event.priceRange && event.priceRange.max > 500) {
      signal = 'bullish';
      confidence = Math.min(0.7, confidence + 0.1);
      reason = 'Premium pricing indicates strong demand';
    }

    // Cancellations
    if (event.status === 'cancelled') {
      signal = 'bearish';
      confidence = 0.5;
      reason = 'Event cancelled — negative signal';
    }

    // Category-specific signals
    if (event.category === 'Music' && event.name.toLowerCase().includes('festival')) {
      relatedTokens.push('live-entertainment', 'ticketing');
    }

    return { event, signal, confidence, reason, relatedTokens };
  }

  /** Find events that could trigger market movements */
  findMarketRelevant(events: EventData[]): EventMarketSignal[] {
    return events
      .map((e) => this.analyze(e))
      .filter((s) => s.confidence > 0.4);
  }

  /** Aggregate signal from multiple events */
  aggregateSignal(signals: EventMarketSignal[]): {
    overall: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    topSignals: EventMarketSignal[];
  } {
    if (signals.length === 0) return { overall: 'neutral', confidence: 0, topSignals: [] };

    const bullish = signals.filter((s) => s.signal === 'bullish').length;
    const bearish = signals.filter((s) => s.signal === 'bearish').length;
    const avgConfidence = signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length;

    return {
      overall: bullish > bearish * 1.5 ? 'bullish' : bearish > bullish * 1.5 ? 'bearish' : 'neutral',
      confidence: avgConfidence,
      topSignals: signals.sort((a, b) => b.confidence - a.confidence).slice(0, 5),
    };
  }
}
