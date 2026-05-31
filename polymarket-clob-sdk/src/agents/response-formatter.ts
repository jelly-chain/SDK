/**
 * Format Polymarket data for agent-friendly output
 */

import type { ClobMarket, ClobOrderbook, OrderbookAnalysis, ArbitrageOpportunity } from '../types.js';

export class ResponseFormatter {
  static formatMarket(market: ClobMarket): string {
    const yesPrice = market.tokens.find((t) => t.outcome === 'Yes')?.price ?? 0.5;
    const noPrice = market.tokens.find((t) => t.outcome === 'No')?.price ?? 0.5;
    return `📊 ${market.question}\n   Yes: ${(yesPrice * 100).toFixed(1)}% | No: ${(noPrice * 100).toFixed(1)}%\n   Volume: $${market.volume?.toLocaleString() ?? 'N/A'} | Ends: ${market.end_date_iso ?? 'TBD'}`;
  }

  static formatMarkets(markets: ClobMarket[]): string {
    if (markets.length === 0) return 'No markets found.';
    return markets.map((m, i) => `${i + 1}. ${this.formatMarket(m)}`).join('\n\n');
  }

  static formatOrderbook(analysis: OrderbookAnalysis): string {
    return `📈 Orderbook Analysis
   Mid Price: ${(analysis.midPrice * 100).toFixed(1)}%
   Spread: ${(analysis.spreadPercent * 100).toFixed(2)}%
   Bid Depth: $${analysis.bidDepth.toLocaleString()}
   Ask Depth: $${analysis.askDepth.toLocaleString()}
   Imbalance: ${analysis.imbalance > 0 ? 'Bullish' : analysis.imbalance < 0 ? 'Bearish' : 'Balanced'} (${(analysis.imbalance * 100).toFixed(1)}%)
   Liquidity Score: ${(analysis.liquidityScore * 100).toFixed(0)}%`;
  }

  static formatArbitrage(opps: ArbitrageOpportunity[]): string {
    if (opps.length === 0) return 'No arbitrage opportunities found.';
    return opps.map((opp, i) =>
      `${i + 1}. ${opp.market}\n   Buy: ${opp.platform1.name} @ ${opp.platform1.price}\n   Sell: ${opp.platform2.name} @ ${opp.platform2.price}\n   Profit: ${(opp.profitPercent).toFixed(2)}%`
    ).join('\n\n');
  }

  static formatForPrediction(market: ClobMarket, orderbook?: OrderbookAnalysis): string {
    const parts: string[] = [];
    parts.push(`## Market: ${market.question}`);
    parts.push(this.formatMarket(market));

    if (orderbook) {
      parts.push('\n### Orderbook');
      parts.push(this.formatOrderbook(orderbook));
    }

    return parts.join('\n');
  }
}
