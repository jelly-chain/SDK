import { ALL_DEFAULT_KEYWORDS, BULLISH_KEYWORDS, BEARISH_KEYWORDS } from '../constants/keywords.js';
import { normalizeKeyword, containsAny } from '../utils/strings.js';
import type { SignalDirection } from '../types.js';

export class KeywordMatcher {
  private keywords: string[];

  constructor(keywords: string[] = ALL_DEFAULT_KEYWORDS) {
    this.keywords = keywords.map(normalizeKeyword);
  }

  match(text: string): { matched: boolean; keywords: string[]; direction: SignalDirection; score: number } {
    const lower = text.toLowerCase();
    const matched = this.keywords.filter((kw) => lower.includes(kw));
    const bullishCount = BULLISH_KEYWORDS.filter((k) => lower.includes(k.toLowerCase())).length;
    const bearishCount = BEARISH_KEYWORDS.filter((k) => lower.includes(k.toLowerCase())).length;
    const direction: SignalDirection = bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral';
    const score = Math.min(1, matched.length / 5);
    return { matched: matched.length > 0, keywords: matched, direction, score };
  }

  addKeyword(keyword: string): void {
    this.keywords.push(normalizeKeyword(keyword));
  }
}
