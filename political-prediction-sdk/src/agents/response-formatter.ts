/**
 * Format Political data for agent-friendly output
 */

import type { PoliticalMarket, PoliticalOutcome, ElectionForecast } from '../types.js';

export class ResponseFormatter {
  static formatMarket(market: PoliticalMarket): string {
    const topOutcome = market.outcomes.sort((a, b) => b.price - a.price)[0];
    return `🗳️ ${market.name}\n   Leader: ${topOutcome?.name ?? 'N/A'} @ ${(topOutcome?.price * 100).toFixed(1)}%\n   Volume: ${market.volume?.toLocaleString() ?? 'N/A'} | Status: ${market.status}`;
  }

  static formatMarkets(markets: PoliticalMarket[]): string {
    if (markets.length === 0) return 'No political markets found.';
    return markets.map((m, i) => `${i + 1}. ${this.formatMarket(m)}`).join('\n\n');
  }

  static formatMarketDetail(market: PoliticalMarket): string {
    const parts: string[] = [];
    parts.push(`## ${market.name}`);
    parts.push(`Category: ${market.category}`);
    parts.push(`Status: ${market.status}`);
    parts.push(`\nOutcomes:`);

    for (const outcome of market.outcomes.sort((a, b) => b.price - a.price)) {
      parts.push(`  ${outcome.name}: ${(outcome.price * 100).toFixed(1)}%`);
    }

    return parts.join('\n');
  }

  static formatElectionForecast(forecast: ElectionForecast): string {
    const parts: string[] = [];
    parts.push(`## Election Forecast: ${forecast.race}`);
    parts.push(`Last Updated: ${forecast.lastUpdated}`);
    parts.push(`\nCandidates:`);

    for (const candidate of forecast.candidates.sort((a, b) => b.winProbability - a.winProbability)) {
      parts.push(`  ${candidate.name} (${candidate.party}): ${(candidate.winProbability * 100).toFixed(1)}% | Polling: ${candidate.pollingAverage.toFixed(1)}%`);
    }

    return parts.join('\n');
  }

  static formatPollComparison(market: PoliticalMarket, pollingAvg: number): string {
    const marketImplied = market.outcomes[0]?.price ?? 0.5;
    const divergence = Math.abs(marketImplied - pollingAvg / 100);
    let signal = 'Aligned';

    if (divergence > 0.1) {
      signal = marketImplied > pollingAvg / 100
        ? 'Market more bullish than polls'
        : 'Polls more bullish than market';
    }

    return `## Market vs Polls: ${market.name}\n\nMarket Implied: ${(marketImplied * 100).toFixed(1)}%\nPolling Average: ${pollingAvg.toFixed(1)}%\nDivergence: ${(divergence * 100).toFixed(1)}%\nSignal: ${signal}`;
  }
}
