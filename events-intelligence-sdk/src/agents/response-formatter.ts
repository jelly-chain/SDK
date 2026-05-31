/**
 * Format Events data for agent-friendly output
 */

import type { EventData, EventMarketSignal } from '../types.js';

export class ResponseFormatter {
  static formatEvent(event: EventData): string {
    const status = event.status === 'sold-out' ? '🔴 SOLD OUT' : event.status === 'cancelled' ? '❌ Cancelled' : '✅ On Sale';
    const price = event.priceRange ? `$${event.priceRange.min}-$${event.priceRange.max}` : 'N/A';
    return `${status} | ${event.name}\n   ${event.category} | ${event.startDate} | ${event.venue?.name ?? 'TBD'}\n   Price: ${price} | Source: ${event.source}`;
  }

  static formatEvents(events: EventData[]): string {
    if (events.length === 0) return 'No events found.';
    return events.map((e, i) => `${i + 1}. ${this.formatEvent(e)}`).join('\n\n');
  }

  static formatSignal(signal: EventMarketSignal): string {
    const emoji = signal.signal === 'bullish' ? '🟢' : signal.signal === 'bearish' ? '🔴' : '⚪';
    return `${emoji} ${signal.event.name}\n   Signal: ${signal.signal.toUpperCase()} | Confidence: ${(signal.confidence * 100).toFixed(0)}%\n   Reason: ${signal.reason}`;
  }

  static formatSignals(signals: EventMarketSignal[]): string {
    if (signals.length === 0) return 'No market-relevant events found.';
    return signals.map((s, i) => `${i + 1}. ${this.formatSignal(s)}`).join('\n\n');
  }

  static formatAggregate(signals: EventMarketSignal[]): string {
    const bullish = signals.filter((s) => s.signal === 'bullish').length;
    const bearish = signals.filter((s) => s.signal === 'bearish').length;
    const neutral = signals.filter((s) => s.signal === 'neutral').length;

    const parts: string[] = [];
    parts.push(`📊 Event Intelligence Summary`);
    parts.push(`   Total Events: ${signals.length}`);
    parts.push(`   Bullish: ${bullish} | Bearish: ${bearish} | Neutral: ${neutral}`);
    parts.push(`   Overall: ${bullish > bearish * 1.5 ? '🟢 BULLISH' : bearish > bullish * 1.5 ? '🔴 BEARISH' : '⚪ NEUTRAL'}`);

    return parts.join('\n');
  }
}
