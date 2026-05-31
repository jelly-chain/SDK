/**
 * Format Betfair data for agent-friendly output
 */

import type { BetfairMarket, BetfairRunner, BetfairPriceSummary, BetfairEvent } from '../types.js';

export class ResponseFormatter {
  static formatEvent(event: BetfairEvent): string {
    return `📋 ${event.eventName}\n   Country: ${event.countryCode ?? 'International'} | Markets: ${event.marketCount}`;
  }

  static formatEvents(events: BetfairEvent[]): string {
    if (events.length === 0) return 'No events found.';
    return events.map((e, i) => `${i + 1}. ${this.formatEvent(e)}`).join('\n\n');
  }

  static formatMarket(market: BetfairMarket): string {
    return `📊 ${market.marketName}\n   Type: ${market.marketType} | Matched: $${market.totalMatched?.toLocaleString() ?? 'N/A'}\n   Status: ${market.status} | Runners: ${market.runners?.length ?? 0}`;
  }

  static formatMarkets(markets: BetfairMarket[]): string {
    if (markets.length === 0) return 'No markets found.';
    return markets.map((m, i) => `${i + 1}. ${this.formatMarket(m)}`).join('\n\n');
  }

  static formatPriceSummary(summary: BetfairPriceSummary): string {
    return `📈 ${summary.runnerName}\n   Best Back: ${summary.bestBack} | Best Lay: ${summary.bestLay}\n   Last Traded: ${summary.lastTraded} | Implied: ${(summary.impliedProbability * 100).toFixed(1)}%\n   Matched: $${summary.totalMatched?.toLocaleString() ?? 'N/A'}`;
  }

  static formatPriceSummaries(summaries: BetfairPriceSummary[]): string {
    if (summaries.length === 0) return 'No price data available.';
    return summaries.map((s, i) => `${i + 1}. ${this.formatPriceSummary(s)}`).join('\n\n');
  }

  static formatForPrediction(market: BetfairMarket, prices: BetfairPriceSummary[]): string {
    const parts: string[] = [];
    parts.push(`## Betfair Exchange: ${market.marketName}`);
    parts.push(`\nMarket Type: ${market.marketType}`);
    parts.push(`Total Matched: $${market.totalMatched?.toLocaleString() ?? 'N/A'}`);

    if (prices.length > 0) {
      parts.push(`\nPrices:`);
      for (const price of prices) {
        parts.push(`  ${price.runnerName}: Back ${price.bestBack} | Lay ${price.bestLay} | Implied ${(price.impliedProbability * 100).toFixed(1)}%`);
      }
    }

    return parts.join('\n');
  }
}
