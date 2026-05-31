/**
 * Format Kalshi data for agent-friendly output
 */

import type { KalshiEvent, KalshiMarket, KalshiPortfolio } from '../types.js';

export class ResponseFormatter {
  static formatEvent(event: KalshiEvent): string {
    return `📋 ${event.title}\n   Category: ${event.category}\n   Status: ${event.status}\n   Markets: ${event.markets?.length ?? 0}`;
  }

  static formatEvents(events: KalshiEvent[]): string {
    if (events.length === 0) return 'No events found.';
    return events.map((e, i) => `${i + 1}. ${this.formatEvent(e)}`).join('\n\n');
  }

  static formatMarket(market: KalshiMarket): string {
    const midPrice = (market.yes_bid + market.yes_ask) / 2;
    return `📊 ${market.title}\n   Yes: ${midPrice.toFixed(1)}¢ | Volume: ${market.volume?.toLocaleString() ?? 'N/A'}\n   Spread: ${(market.yes_ask - market.yes_bid).toFixed(1)}¢ | Open Interest: ${market.open_interest?.toLocaleString() ?? 'N/A'}`;
  }

  static formatMarkets(markets: KalshiMarket[]): string {
    if (markets.length === 0) return 'No markets found.';
    return markets.map((m, i) => `${i + 1}. ${this.formatMarket(m)}`).join('\n\n');
  }

  static formatPortfolio(portfolio: KalshiPortfolio): string {
    const parts: string[] = [];
    parts.push(`💰 Portfolio Summary`);
    parts.push(`   Balance: $${portfolio.balance.toFixed(2)}`);
    parts.push(`   Total Value: $${portfolio.total_value.toFixed(2)}`);
    parts.push(`   Total PnL: ${portfolio.total_pnl >= 0 ? '+' : ''}$${portfolio.total_pnl.toFixed(2)}`);

    if (portfolio.positions.length > 0) {
      parts.push('\n   Positions:');
      for (const pos of portfolio.positions) {
        parts.push(`   - ${pos.title}: ${pos.quantity} ${pos.side} @ ${pos.average_price}¢ | PnL: ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)}`);
      }
    }

    return parts.join('\n');
  }

  static formatForPrediction(market: KalshiMarket): string {
    const midPrice = (market.yes_bid + market.yes_ask) / 2;
    return `## Kalshi Market: ${market.title}\n\nImplied Probability: ${(midPrice / 100).toFixed(3)}\nVolume: ${market.volume?.toLocaleString() ?? 'N/A'}\nOpen Interest: ${market.open_interest?.toLocaleString() ?? 'N/A'}\nStatus: ${market.status}`;
  }
}
