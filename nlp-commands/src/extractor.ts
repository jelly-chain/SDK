import { ExtractedEntity } from '../types.js';

export class Extractor {
  // Known token map — production would use a comprehensive token list
  private readonly TOKENS: Record<string, string> = {
    eth: 'ETH', ethereum: 'ETH', bitcoin: 'BTC', btc: 'BTC',
    sol: 'SOL', solana: 'SOL', bnb: 'BNB', sui: 'SUI',
    ton: 'TON', doge: 'DOGE', avax: 'AVAX', matic: 'MATIC',
    usdc: 'USDC', usdt: 'USDT', dai: 'DAI', weth: 'WETH',
  };

  private readonly CHAINS: Record<string, string> = {
    ethereum: 'ethereum', eth: 'ethereum', bsc: 'bnb', 'bnb chain': 'bnb',
    solana: 'solana', sol: 'solana', polygon: 'polygon', matic: 'polygon',
    arbitrum: 'arbitrum', optimism: 'optimism', base: 'base',
    sui: 'sui', ton: 'ton', avalanche: 'avalanche', avax: 'avalanche',
  };

  private readonly TIMEFRAMES: Record<string, string> = {
    '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h',
    '1d': '1d', '1w': '1w', 'daily': '1d', 'hourly': '1h',
  };

  /**
   * Extract all entities from text.
   */
  extract(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    entities.push(...this.extractTokens(text));
    entities.push(...this.extractAmounts(text));
    entities.push(...this.extractChains(text));
    entities.push(...this.extractPrices(text));
    entities.push(...this.extractTimeframes(text));
    return entities;
  }

  private extractTokens(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    for (const [keyword, symbol] of Object.entries(this.TOKENS)) {
      const idx = text.indexOf(keyword);
      if (idx !== -1) {
        entities.push({ type: 'token', value: symbol, position: [idx, idx + keyword.length] });
      }
    }
    return entities;
  }

  private extractAmounts(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    // Match: 1000, 1,000, 0.5, 1.5k, 2m, 50%, half, all
    const amountRe = /(\d[\d,]*\.?\d*)\s*(k|m|b)?|(\d+)%|half|all|full/gi;
    let match;
    while ((match = amountRe.exec(text)) !== null) {
      const value = match[1] ? `${match[1]}${match[2] || ''}` : match[0];
      entities.push({ type: 'amount', value, position: [match.index, match.index + match[0].length] });
    }
    return entities;
  }

  private extractChains(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    for (const [keyword, chain] of Object.entries(this.CHAINS)) {
      const idx = text.indexOf(keyword);
      if (idx !== -1) {
        entities.push({ type: 'chain', value: chain, position: [idx, idx + keyword.length] });
      }
    }
    return entities;
  }

  private extractPrices(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const priceRe = /(?:at\s+)?\$?(\d[\d,]*\.?\d*)/gi;
    let match;
    while ((match = priceRe.exec(text)) !== null) {
      entities.push({ type: 'price', value: match[1], position: [match.index, match.index + match[0].length] });
    }
    return entities;
  }

  private extractTimeframes(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    for (const [keyword, tf] of Object.entries(this.TIMEFRAMES)) {
      const idx = text.indexOf(keyword);
      if (idx !== -1) {
        entities.push({ type: 'timeframe', value: tf, position: [idx, idx + keyword.length] });
      }
    }
    return entities;
  }
}
