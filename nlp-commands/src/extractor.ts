/**
 * Entity Extractor — identifies and extracts trading-relevant entities
 * from natural language text using regex patterns, keyword matching,
 * and contextual analysis.
 */

import type {
  ExtractedEntity, TokenRef, ChainType, VenueType,
  ConditionType, ActionType, TokenMap
} from "./types.js";

// ── Token Registry ──────────────────────────────────────────────────────────

const TOKEN_ALIASES: Record<string, TokenRef> = {
  "ETH":   { symbol: "ETH",  chain: "ethereum", decimals: 18 },
  "WETH":  { symbol: "WETH", chain: "ethereum", decimals: 18 },
  "BTC":   { symbol: "BTC",  chain: "bitcoin",  decimals: 8 },
  "WBTC":  { symbol: "WBTC", chain: "ethereum", decimals: 8 },
  "USDC":  { symbol: "USDC", chain: "ethereum", decimals: 6 },
  "USDT":  { symbol: "USDT", chain: "ethereum", decimals: 6 },
  "DAI":   { symbol: "DAI",  chain: "ethereum", decimals: 18 },
  "SOL":   { symbol: "SOL",  chain: "solana",   decimals: 9 },
  "BNB":   { symbol: "BNB",  chain: "bsc",      decimals: 18 },
  "MATIC": { symbol: "MATIC",chain: "polygon",  decimals: 18 },
  "ARB":   { symbol: "ARB",  chain: "arbitrum", decimals: 18 },
  "OP":    { symbol: "OP",   chain: "optimism", decimals: 18 },
  "AVAX":  { symbol: "AVAX", chain: "avalanche",decimals: 18 },
  "LINK":  { symbol: "LINK", chain: "ethereum", decimals: 18 },
  "UNI":   { symbol: "UNI",  chain: "ethereum", decimals: 18 },
  "AAVE":  { symbol: "AAVE", chain: "ethereum", decimals: 18 },
  "SNX":   { symbol: "SNX",  chain: "ethereum", decimals: 18 },
  "CRV":   { symbol: "CRV",  chain: "ethereum", decimals: 18 },
  "LDO":   { symbol: "LDO",  chain: "ethereum", decimals: 18 },
  "MKR":   { symbol: "MKR",  chain: "ethereum", decimals: 18 },
  "RPL":   { symbol: "RPL",  chain: "ethereum", decimals: 18 },
  "SUSHI": { symbol: "SUSHI",chain: "ethereum", decimals: 18 },
  "COMP":  { symbol: "COMP", chain: "ethereum", decimals: 18 },
  "YFI":   { symbol: "YFI",  chain: "ethereum", decimals: 18 },
  "SPELL": { symbol: "SPELL",chain: "ethereum", decimals: 18 },
  "TOKE":  { symbol: "TOKE", chain: "ethereum", decimals: 18 },
  "FXS":   { symbol: "FXS",  chain: "ethereum", decimals: 18 },
  "FRAX":  { symbol: "FRAX", chain: "ethereum", decimals: 18 },
  "LUSD":  { symbol: "LUSD", chain: "ethereum", decimals: 18 },
  "GHO":   { symbol: "GHO",  chain: "ethereum", decimals: 18 },
  "SUI":   { symbol: "SUI",  chain: "sui",      decimals: 9 },
  "APT":   { symbol: "APT",  chain: "aptos",    decimals: 8 },
  "NEAR":  { symbol: "NEAR", chain: "near",     decimals: 24 },
  "TON":   { symbol: "TON",  chain: "ton",      decimals: 9 },
  "TRX":   { symbol: "TRX",  chain: "tron",     decimals: 6 },
  "TONCOIN": { symbol: "TON", chain: "ton",     decimals: 9 },
  "PEPE":  { symbol: "PEPE", chain: "ethereum", decimals: 18 },
  "SHIB":  { symbol: "SHIB", chain: "ethereum", decimals: 18 },
  "FLOKI": { symbol: "FLOKI",chain: "ethereum", decimals: 9 },
  "WIF":   { symbol: "WIF",  chain: "solana",   decimals: 6 },
  "BONK":  { symbol: "BONK", chain: "solana",   decimals: 5 },
  "WEN":   { symbol: "WEN",  chain: "solana",   decimals: 5 },
  "POPCAT":{ symbol: "POPCAT",chain:"solana",   decimals: 9 },
};

const CHAIN_ALIASES: Record<string, ChainType> = {
  "ethereum": "ethereum", "eth": "ethereum", "mainnet": "ethereum",
  "bsc": "bsc", "binance": "bsc", "bnb chain": "bsc",
  "polygon": "polygon", "matic": "polygon",
  "arbitrum": "arbitrum", "arb": "arbitrum", "arbitrum one": "arbitrum",
  "optimism": "optimism", "op": "optimism", "op mainnet": "optimism",
  "base": "base",
  "avalanche": "avalanche", "avax": "avalanche",
  "solana": "solana", "sol": "solana",
  "sui": "sui",
  "ton": "ton", "toncoin": "ton",
  "bitcoin": "bitcoin", "btc": "bitcoin",
  "tron": "tron", "trx": "tron",
  "linea": "linea",
  "scroll": "scroll",
  "zksync": "zksync", "zk sync": "zksync",
  "mantle": "mantle",
  "blast": "blast",
  "sei": "sei",
  "aptos": "aptos", "apt": "aptos",
  "near": "near",
  "cosmos": "cosmos", "atom": "cosmos",
  "osmosis": "osmosis", "osmo": "osmosis",
  "injective": "injective", "inj": "injective",
};

const VENUE_ALIASES: Record<string, VenueType> = {
  "uniswap": "uniswap", "uni": "uniswap", "uni v3": "uniswap", "uni v2": "uniswap",
  "sushiswap": "sushiswap", "sushi": "sushiswap",
  "pancakeswap": "pancakeswap", "pancake": "pancakeswap", "cake": "pancakeswap",
  "curve": "curve", "curve finance": "curve",
  "balancer": "balancer", "bal": "balancer",
  "jupiter": "jupiter", "jup": "jupiter",
  "raydium": "raydium", "ray": "raydium",
  "orca": "orca",
  "lifinity": "lifinity",
  "meteora": "meteora",
  "odos": "odos",
  "1inch": "1inch", "one inch": "1inch",
  "cowswap": "cowswap", "cow": "cowswap",
  "paraswap": "paraswap", "para": "paraswap",
  "kyber": "kyber", "kyber swap": "kyber",
  "gmx": "gmx",
  "dydx": "dydx", "dydx v4": "dydx",
  "hyperliquid": "hyperliquid", "hyper": "hyperliquid",
  "vertex": "vertex",
  "orderly": "orderly",
  "polymarket": "polymarket", "poly": "polymarket",
  "kalshi": "kalshi",
  "betfair": "betfair",
  "manifold": "manifold", "mana": "manifold",
};

// ── Action Patterns (multi-language) ────────────────────────────────────────

const ACTION_PATTERNS: Record<string, { pattern: RegExp; action: ActionType }[]> = {
  en: [
    { pattern: /\b(buy|purchase|long|acquire|get into)\b/i,                  action: "BUY" },
    { pattern: /\b(sell|short|dump|exit|unload|liquidate position)\b/i,      action: "SELL" },
    { pattern: /\b(swap|trade|exchange|convert)\b/i,                         action: "SWAP" },
    { pattern: /\b(bridge|cross.?chain|move across|transfer across)\b/i,      action: "BRIDGE" },
    { pattern: /\b(stake|staking|deposit into|lock up)\b/i,                  action: "STAKE" },
    { pattern: /\b(unstake|withdraw|unlock|exit staking)\b/i,                action: "UNSTAKE" },
    { pattern: /\b(claim|collect|harvest rewards|withdraw rewards)\b/i,      action: "CLAIM" },
    { pattern: /\b(approve|allow|authorize permission)\b/i,                  action: "APPROVE" },
    { pattern: /\b(cancel|revoke|abort order)\b/i,                           action: "CANCEL" },
    { pattern: /\b(limit buy|buy limit|buy at exactly)\b/i,                  action: "LIMIT_BUY" },
    { pattern: /\b(limit sell|sell limit|sell at exactly)\b/i,               action: "LIMIT_SELL" },
    { pattern: /\b(stop loss|stop.?loss|sl|cut losses)\b/i,                  action: "STOP_LOSS" },
    { pattern: /\b(take profit|tp|take gains|lock in profit)\b/i,            action: "TAKE_PROFIT" },
    { pattern: /\b(dca|dollar cost avg|dollar cost average|recurring buy)\b/i, action: "DCA" },
    { pattern: /\b(rebalance|rebalance portfolio|rebal)\b/i,                 action: "REBALANCE" },
    { pattern: /\b(harvest|compound|auto compound|compound rewards)\b/i,     action: "HARVEST" },
    { pattern: /\b(lend|supply|deposit lending|provide liquidity)\b/i,       action: "LEND" },
    { pattern: /\b(borrow|take loan|leverage up)\b/i,                        action: "BORROW" },
    { pattern: /\b(repay|pay back|repay loan|close debt)\b/i,               action: "REPAY" },
    { pattern: /\b(close position|close out|close my)\b/i,                   action: "CLOSE" },
    { pattern: /\b(roll|rollover|extend position|roll forward)\b/i,          action: "ROLL" },
    { pattern: /\b(transfer|send)\b/i,                                       action: "TRANSFER" },
    { pattern: /\b(wrap|wrap eth|wrap btc)\b/i,                              action: "WRAP" },
    { pattern: /\b(unwrap|unwrap weth|unwrap wbtc)\b/i,                      action: "UNWRAP" },
  ],
  zh: [
    { pattern: /(买入|购买|做多|建仓)/,   action: "BUY" },
    { pattern: /(卖出|出售|做空|平仓)/,   action: "SELL" },
    { pattern: /(兑换|交换|转换)/,        action: "SWAP" },
    { pattern: /(跨链|桥接)/,             action: "BRIDGE" },
    { pattern: /(质押|staking)/,          action: "STAKE" },
    { pattern: /(取消质押|解除质押)/,      action: "UNSTAKE" },
    { pattern: /(领取|提取收益)/,          action: "CLAIM" },
    { pattern: /(授权|批准)/,             action: "APPROVE" },
    { pattern: /(取消|撤销)/,             action: "CANCEL" },
    { pattern: /(限价买入|挂买单)/,        action: "LIMIT_BUY" },
    { pattern: /(限价卖出|挂卖单)/,        action: "LIMIT_SELL" },
    { pattern: /(止损|stop loss)/,        action: "STOP_LOSS" },
    { pattern: /(止盈|take profit)/,      action: "TAKE_PROFIT" },
    { pattern: /(定投|分批买入)/,          action: "DCA" },
    { pattern: /(再平衡|调仓)/,           action: "REBALANCE" },
  ],
  es: [
    { pattern: /(comprar|adquirir|largar)/i,    action: "BUY" },
    { pattern: /(vender|vender corto|salir)/i,   action: "SELL" },
    { pattern: /(cambiar|intercambiar)/i,        action: "SWAP" },
    { pattern: /(puente|cruzar cadena)/i,        action: "BRIDGE" },
    { pattern: /(stakear|bloquear)/i,            action: "STAKE" },
  ],
};

// ── Extractor Class ─────────────────────────────────────────────────────────

export class EntityExtractor {
  private customTokens: Record<string, TokenRef>;
  private customChains: Record<string, ChainType> = {};
  private customVenues: Record<string, VenueType> = {};

  constructor(customTokens?: Record<string, TokenRef>) {
    this.customTokens = customTokens || {};
  }

  /** Detect language from text heuristics */
  detectLanguage(text: string): string {
    const codePoints = [...text];
    let cjk = 0, latin = 0, cyrillic = 0, arabic = 0, devanagari = 0;
    for (const cp of codePoints) {
      const n = cp.codePointAt(0)!;
      if (n >= 0x4E00 && n <= 0x9FFF) cjk++;
      else if (n >= 0x3040 && n <= 0x30FF) return "ja"; // hiragana/katakana
      else if (n >= 0xAC00 && n <= 0xD7AF) return "ko";
      else if ((n >= 0x0041 && n <= 0x007A) || (n >= 0x00C0 && n <= 0x024F)) latin++;
      else if (n >= 0x0400 && n <= 0x04FF) cyrillic++;
      else if (n >= 0x0600 && n <= 0x06FF) arabic++;
      else if (n >= 0x0900 && n <= 0x097F) devanagari++;
    }
    if (cjk > latin && cjk > 3) return "zh";
    if (cyrillic > latin) return "ru";
    if (arabic > latin) return "ar";
    if (devanagari > latin) return "hi";

    // Spanish heuristics
    if (/\b(comprar|vender|cambiar|cuando|precio|arriba|abajo)\b/i.test(text)) return "es";
    return "en";
  }

  /** Extract all entities from a text string */
  extract(text: string, lang?: string): ExtractedEntity[] {
    const language = lang || this.detectLanguage(text);
    const entities: ExtractedEntity[] = [];

    entities.push(...this.extractTokens(text));
    entities.push(...this.extractActions(text, language));
    entities.push(...this.extractChains(text));
    entities.push(...this.extractVenues(text));
    entities.push(...this.extractAmounts(text));
    entities.push(...this.extractConditions(text, language));
    entities.push(...this.extractAddresses(text));
    entities.push(...this.extractTimeExpressions(text, language));
    entities.push(...this.extractPercentages(text));

    // Deduplicate overlapping entities
    return this.deduplicate(entities);
  }

  private extractTokens(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    // $TOKEN pattern (CoinGecko-style)
    const dollarPattern = /\$([A-Z]{1,10})\b/g;
    let m: RegExpExecArray | null;
    while ((m = dollarPattern.exec(text)) !== null) {
      const sym = m[1]!;
      entities.push({
        type: "token", value: sym, normalized: sym.toUpperCase(),
        confidence: 0.95, start: m.index, end: m.index + m[0].length,
      });
    }
    // Explicit token symbols (2-10 uppercase chars)
    const symPattern = /\b([A-Z]{2,10})\b/g;
    while ((m = symPattern.exec(text)) !== null) {
      const sym = m[1]!;
      const upper = sym.toUpperCase();
      if (TOKEN_ALIASES[upper] || this.customTokens[upper]) {
        entities.push({
          type: "token", value: sym, normalized: upper,
          confidence: 0.9, start: m.index, end: m.index + m[0].length,
        });
      }
    }
    // Token by address (0x...)
    const addrPattern = /\b(0x[a-fA-F0-9]{40})\b/g;
    while ((m = addrPattern.exec(text)) !== null) {
      entities.push({
        type: "address", value: m[0], normalized: m[0].toLowerCase(),
        confidence: 0.99, start: m.index, end: m.index + m[0].length,
      });
    }
    // Solana addresses (base58)
    const solAddr = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/g;
    while ((m = solAddr.exec(text)) !== null) {
      if (/^0x/.test(m[0])) continue; // skip if also matches ETH pattern
      entities.push({
        type: "address", value: m[0], normalized: m[0],
        confidence: 0.7, start: m.index, end: m.index + m[0].length,
      });
    }
    return entities;
  }

  private extractActions(text: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const patterns = ACTION_PATTERNS[language] || ACTION_PATTERNS["en"];
    for (const { pattern, action } of patterns!) {
      const m = pattern.exec(text);
      if (m) {
        entities.push({
          type: "action", value: m[0], normalized: action,
          confidence: language === "en" ? 0.92 : 0.85,
          start: m.index, end: m.index + m[0].length,
        });
        break; // only first match
      }
    }
    return entities;
  }

  private extractChains(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    for (const [alias, chain] of Object.entries(CHAIN_ALIASES)) {
      const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const m = re.exec(text);
      if (m) {
        entities.push({
          type: "chain", value: m[0], normalized: chain,
          confidence: 0.88, start: m.index, end: m.index + m[0].length,
        });
      }
    }
    return entities;
  }

  private extractVenues(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    for (const [alias, venue] of Object.entries(VENUE_ALIASES)) {
      const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const m = re.exec(text);
      if (m) {
        entities.push({
          type: "venue", value: m[0], normalized: venue,
          confidence: 0.9, start: m.index, end: m.index + m[0].length,
        });
      }
    }
    return entities;
  }

  private extractAmounts(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    // Numbers with optional decimals
    const re = /\b(\d+(?:\.\d+)?)\s*(k|K|m|M|b|B|t|T)?\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      let val = parseFloat(m[1]!);
      const suffix = m[2]?.toLowerCase();
      if (suffix === "k") val *= 1_000;
      else if (suffix === "m") val *= 1_000_000;
      else if (suffix === "b") val *= 1_000_000_000;
      entities.push({
        type: "amount", value: m[0], normalized: String(val),
        confidence: 0.95, start: m.index, end: m.index + m[0].length,
      });
    }
    return entities;
  }

  private extractConditions(text: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    if (language === "en") {
      // "above $X", "below $X", "if price reaches $X"
      const priceAbove = /\b(?:above|over|greater than|hits|reaches)\s*\$?([\d,.]+)\b/gi;
      const priceBelow = /\b(?:below|under|less than|drops?\s*(?:to|below))\s*\$?([\d,.]+)\b/gi;
      const gasBelow = /\bgas\s*(?:below|under|less than)\s*([\d]+)\b/gi;
      const slippageBelow = /\bslippage\s*(?:below|under|less than)\s*([\d.]+)\b/gi;
      const volumeAbove = /\bvolume\s*(?:above|over|greater than)\s*\$?([\d,.]+[kKmMbB]?)\b/gi;

      let m: RegExpExecArray | null;
      while ((m = priceAbove.exec(text)) !== null) {
        entities.push({ type: "condition", value: m[0], normalized: `price_above:${m[1]}`, confidence: 0.88, start: m.index, end: m.index + m[0].length });
      }
      while ((m = priceBelow.exec(text)) !== null) {
        entities.push({ type: "condition", value: m[0], normalized: `price_below:${m[1]}`, confidence: 0.88, start: m.index, end: m.index + m[0].length });
      }
      while ((m = gasBelow.exec(text)) !== null) {
        entities.push({ type: "condition", value: m[0], normalized: `gas_below:${m[1]}`, confidence: 0.85, start: m.index, end: m.index + m[0].length });
      }
      while ((m = slippageBelow.exec(text)) !== null) {
        entities.push({ type: "condition", value: m[0], normalized: `slippage_below:${m[1]}`, confidence: 0.85, start: m.index, end: m.index + m[0].length });
      }
      while ((m = volumeAbove.exec(text)) !== null) {
        entities.push({ type: "condition", value: m[0], normalized: `volume_above:${m[1]}`, confidence: 0.8, start: m.index, end: m.index + m[0].length });
      }
    }
    return entities;
  }

  private extractAddresses(text: string): ExtractedEntity[] {
    // Already handled in extractTokens, but also catch ENS names
    const entities: ExtractedEntity[] = [];
    const ensPattern = /\b([a-zA-Z0-9-]+\.eth)\b/g;
    let m: RegExpExecArray | null;
    while ((m = ensPattern.exec(text)) !== null) {
      entities.push({
        type: "address", value: m[0], normalized: m[0].toLowerCase(),
        confidence: 0.95, start: m.index, end: m.index + m[0].length,
      });
    }
    return entities;
  }

  private extractTimeExpressions(text: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const patterns: Record<string, RegExp> = {
      "30m": /\b(30\s*min|half an hour)\b/i,
      "1h":  /\b(1\s*hour|one hour|an hour)\b/i,
      "4h":  /\b(4\s*hours)\b/i,
      "1d":  /\b(1\s*day|one day|daily|24h|24\s*hours)\b/i,
      "1w":  /\b(1\s*week|one week|weekly)\b/i,
    };
    for (const [timeframe, re] of Object.entries(patterns)) {
      const m = re.exec(text);
      if (m) {
        entities.push({
          type: "time", value: m[0], normalized: timeframe,
          confidence: 0.85, start: m.index, end: m.index + m[0].length,
        });
      }
    }
    return entities;
  }

  private extractPercentages(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const re = /\b(\d+(?:\.\d+)?)\s*%/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      entities.push({
        type: "percentage", value: m[0], normalized: m[1]!,
        confidence: 0.98, start: m.index, end: m.index + m[0].length,
      });
    }
    return entities;
  }

  private deduplicate(entities: ExtractedEntity[]): ExtractedEntity[] {
    // Sort by confidence descending, then remove overlaps
    entities.sort((a, b) => b.confidence - a.confidence);
    const result: ExtractedEntity[] = [];
    const covered = new Set<number>();
    for (const e of entities) {
      let overlap = false;
      for (let i = e.start; i < e.end; i++) {
        if (covered.has(i)) { overlap = true; break; }
      }
      if (!overlap) {
        result.push(e);
        for (let i = e.start; i < e.end; i++) covered.add(i);
      }
    }
    return result.sort((a, b) => a.start - b.start);
  }
}
