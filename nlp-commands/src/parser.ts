/**
 * NLP Command Parser — converts extracted entities into structured TradingCommand objects.
 * Multi-language support: English, Chinese, Spanish, Japanese.
 */

import type {
  ParseResult, TradingCommand, ExtractedEntity, ParserConfig,
  ActionType, Condition, TokenRef, ChainType, VenueType,
  ConditionType, TokenBalance,
} from "./types.js";
import { EntityExtractor } from "./extractor.js";

// ── Default Config ──────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ParserConfig = {
  defaultChain: "ethereum" as ChainType,
  defaultSlippage: 0.5,
  defaultDeadline: 300,
  maxGasPrice: 100,
  supportedLanguages: ["en", "zh", "es", "ja"],
  strictMode: false,
  expandShorthand: true,
  inferMissing: true,
};

// ── Amount Parser ────────────────────────────────────────────────────────────

function parseAmountValue(raw: string, entities: ExtractedEntity[]): number | undefined {
  const amountEntity = entities.find(e => e.type === "amount");
  if (!amountEntity) return undefined;
  const val = parseFloat(amountEntity.normalized);
  if (isNaN(val)) return undefined;

  // Check for k/m/b/t suffixes
  const rawUpper = amountEntity.value.toUpperCase();
  if (/[K]$/.test(rawUpper)) return val * 1_000;
  if (/[M]$/.test(rawUpper)) return val * 1_000_000;
  if (/[B]$/.test(rawUpper)) return val * 1_000_000_000;
  if (/[T]$/.test(rawUpper)) return val * 1_000_000_000_000;
  return val;
}

function parsePercentage(raw: string, entities: ExtractedEntity[]): number | undefined {
  const pctEntity = entities.find(e => e.type === "percentage");
  if (!pctEntity) return undefined;
  return parseFloat(pctEntity.normalized);
}

// ── Action Classifier ───────────────────────────────────────────────────────

function classifyAction(entities: ExtractedEntity[], config: ParserConfig): { action: ActionType; confidence: number } {
  const actionEntity = entities.find(e => e.type === "action");
  if (actionEntity) {
    return { action: actionEntity.normalized as ActionType, confidence: actionEntity.confidence };
  }

  return { action: "SWAP", confidence: 0.3 };
}

// ── Token Resolver ──────────────────────────────────────────────────────────

function resolveTokens(entities: ExtractedEntity[], config: ParserConfig): { tokenIn?: TokenRef; tokenOut?: TokenRef } {
  const tokenEntities = entities.filter(e => e.type === "token");
  if (tokenEntities.length === 0) return {};

  const customMap = config.customTokenMap || {};

  const resolve = (sym: string): TokenRef | undefined => {
    const upper = sym.toUpperCase();
    return customMap[upper] || TOKEN_REGISTRY[upper];
  };

  if (tokenEntities.length === 1) {
    const ref = resolve(tokenEntities[0]!.normalized);
    return { tokenOut: ref };
  }

  const first = resolve(tokenEntities[0]!.normalized);
  const second = resolve(tokenEntities[1]!.normalized);
  return { tokenIn: first, tokenOut: second };
}

const TOKEN_REGISTRY: Record<string, TokenRef> = {
  "ETH":  { symbol: "ETH",  chain: "ethereum" as ChainType, decimals: 18 },
  "WETH": { symbol: "WETH", chain: "ethereum" as ChainType, decimals: 18 },
  "BTC":  { symbol: "BTC",  chain: "bitcoin"  as ChainType, decimals: 8  },
  "WBTC": { symbol: "WBTC", chain: "ethereum" as ChainType, decimals: 8  },
  "USDC": { symbol: "USDC", chain: "ethereum" as ChainType, decimals: 6  },
  "USDT": { symbol: "USDT", chain: "ethereum" as ChainType, decimals: 6  },
  "DAI":  { symbol: "DAI",  chain: "ethereum" as ChainType, decimals: 18 },
  "SOL":  { symbol: "SOL",  chain: "solana"   as ChainType, decimals: 9  },
  "BNB":  { symbol: "BNB",  chain: "bsc"      as ChainType, decimals: 18 },
  "MATIC":{ symbol: "MATIC",chain: "polygon"  as ChainType, decimals: 18 },
  "ARB":  { symbol: "ARB",  chain: "arbitrum" as ChainType, decimals: 18 },
  "OP":   { symbol: "OP",   chain: "optimism" as ChainType, decimals: 18 },
  "AVAX": { symbol: "AVAX", chain: "avalanche"as ChainType, decimals: 18 },
  "LINK": { symbol: "LINK", chain: "ethereum" as ChainType, decimals: 18 },
  "UNI":  { symbol: "UNI",  chain: "ethereum" as ChainType, decimals: 18 },
  "AAVE": { symbol: "AAVE", chain: "ethereum" as ChainType, decimals: 18 },
  "SUI":  { symbol: "SUI",  chain: "sui"      as ChainType, decimals: 9  },
  "APT":  { symbol: "APT",  chain: "aptos"    as ChainType, decimals: 8  },
};

// ── Chain Resolver ──────────────────────────────────────────────────────────

function resolveChain(entities: ExtractedEntity[], config: ParserConfig): ChainType | undefined {
  const chainEntity = entities.find(e => e.type === "chain");
  if (chainEntity) return chainEntity.normalized as ChainType;
  return config.defaultChain;
}

// ── Venue Resolver ──────────────────────────────────────────────────────────

function resolveVenue(entities: ExtractedEntity[], config: ParserConfig): VenueType | undefined {
  const venueEntity = entities.find(e => e.type === "venue");
  if (venueEntity) return venueEntity.normalized as VenueType;
  if (config.customVenueMap) {
    // Try to match any entity value against custom venue map
    for (const e of entities) {
      const normalized = e.normalized.toLowerCase();
      if (config.customVenueMap![normalized]) return config.customVenueMap![normalized];
    }
  }
  return undefined;
}

// ── Condition Builder ───────────────────────────────────────────────────────

function buildConditions(raw: string, entities: ExtractedEntity[], language: string): Condition[] {
  const conditions: Condition[] = [];

  for (const entity of entities) {
    if (entity.type !== "condition") continue;
    const normalized = entity.normalized;

    if (normalized.startsWith("price_above:")) {
      conditions.push({
        type: "price_above" as ConditionType,
        value: parseFloat(normalized.split(":")[1]!),
      });
    } else if (normalized.startsWith("price_below:")) {
      conditions.push({
        type: "price_below" as ConditionType,
        value: parseFloat(normalized.split(":")[1]!),
      });
    } else if (normalized.startsWith("gas_below:")) {
      conditions.push({
        type: "gas_below" as ConditionType,
        value: parseFloat(normalized.split(":")[1]!),
      });
    } else if (normalized.startsWith("slippage_below:")) {
      conditions.push({
        type: "slippage_below" as ConditionType,
        value: parseFloat(normalized.split(":")[1]!),
      });
    } else if (normalized.startsWith("volume_above:")) {
      conditions.push({
        type: "volume_above" as ConditionType,
        value: parseVolumeString(normalized.split(":")[1]!),
      });
    }
  }

  return conditions;
}

function parseVolumeString(s: string): number {
  s = s.toUpperCase().replace(/,/g, "");
  if (s.endsWith("K")) return parseFloat(s) * 1_000;
  if (s.endsWith("M")) return parseFloat(s) * 1_000_000;
  if (s.endsWith("B")) return parseFloat(s) * 1_000_000_000;
  return parseFloat(s);
}

// ── Command ID Generator ────────────────────────────────────────────────────

let commandCounter = 0;
function generateCommandId(): string {
  return `cmd-${Date.now()}-${++commandCounter}`;
}

// ── Main Parser ─────────────────────────────────────────────────────────────

export class NLParser {
  private extractor: EntityExtractor;
  private config: ParserConfig;

  constructor(config?: Partial<ParserConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.extractor = new EntityExtractor(this.config.customTokenMap);
  }

  /** Parse a single natural language command */
  parse(raw: string, language?: string): ParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      const lang = language || this.extractor.detectLanguage(raw);
      const entities = this.extractor.extract(raw, lang);

      if (entities.length === 0) {
        errors.push("No entities could be extracted from input");
        return {
          commands: [],
          intent: "unknown",
          entities: [],
          confidence: 0,
          language: lang,
          raw,
          errors,
          warnings,
          suggestions: ["Try a more specific command like 'buy 1 ETH on Uniswap'"],
        };
      }

      const { action, confidence: actionConfidence } = classifyAction(entities, this.config);
      const { tokenIn, tokenOut } = resolveTokens(entities, this.config);
      const amount = parseAmountValue(raw, entities);
      const percentage = parsePercentage(raw, entities);
      const chain = resolveChain(entities, this.config);
      const venue = resolveVenue(entities, this.config);
      const conditions = buildConditions(raw, entities, lang);

      // Determine amount type
      let amountType: "absolute" | "percentage" | "all" | undefined;
      if (percentage !== undefined) {
        amountType = "percentage";
      } else if (amount !== undefined) {
        amountType = "absolute";
      }
      if (/all/i.test(raw) && !amount) {
        amountType = "all";
      }

      // Validate
      if (!tokenOut && !tokenIn) {
        if (this.config.strictMode) {
          errors.push("No token specified");
        } else {
          warnings.push("No token detected — command may be incomplete");
          suggestions.push("Specify a token, e.g. 'buy ETH' or 'swap USDC to ETH'");
        }
      }

      if (amount !== undefined && amount <= 0) {
        errors.push("Amount must be positive");
      }

      if (chain && !["ethereum", "bsc", "polygon", "arbitrum", "optimism", "base",
        "avalanche", "solana", "sui", "aptos", "ton", "bitcoin", "tron",
        "linea", "scroll", "zksync", "mantle", "blast", "sei"].includes(chain)) {
        warnings.push(`Chain '${chain}' may not be supported by all venues`);
      }

      // Build command
      const command: TradingCommand = {
        id: generateCommandId(),
        action,
        tokenIn,
        tokenOut,
        amount: amount ?? percentage,
        amountType,
        venue,
        chain,
        conditions: conditions.length > 0 ? conditions : undefined,
        slippage: this.config.defaultSlippage,
        deadline: this.config.defaultDeadline,
        raw,
        confidence: actionConfidence * (entities.length > 2 ? 0.95 : 0.7),
        language: lang,
        parsed: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      const intent = this.inferIntent(action, tokenOut?.symbol || tokenIn?.symbol, amount, chain, venue);

      return {
        commands: [command],
        intent,
        entities,
        confidence: command.confidence,
        language: lang,
        raw,
        errors,
        warnings,
        suggestions,
      };
    } catch (err) {
      errors.push(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
      return {
        commands: [],
        intent: "error",
        entities: [],
        confidence: 0,
        language: language || "en",
        raw,
        errors,
        warnings,
        suggestions: [],
      };
    }
  }

  /** Parse multiple commands from a single input (semicolon or newline separated) */
  parseBatch(input: string, language?: string): ParseResult[] {
    const parts = input.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
    return parts.map(part => this.parse(part, language));
  }

  /** Parse with streaming — returns results as they're parsed */
  async *parseStream(input: string, language?: string): AsyncGenerator<ParseResult> {
    const parts = input.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      yield this.parse(part, language);
    }
  }

  private inferIntent(
    action: ActionType,
    token?: string,
    amount?: number,
    chain?: ChainType,
    venue?: VenueType,
  ): string {
    const parts = [action.toLowerCase()];
    if (amount) parts.push(amount.toString());
    if (token) parts.push(token);
    if (venue) parts.push(`on ${venue}`);
    if (chain) parts.push(`on ${chain}`);
    return parts.join(" ");
  }

  /** Update config at runtime */
  updateConfig(partial: Partial<ParserConfig>): void {
    Object.assign(this.config, partial);
    if (partial.customTokenMap) {
      this.extractor = new EntityExtractor(this.config.customTokenMap);
    }
  }

  getConfig(): Readonly<ParserConfig> {
    return { ...this.config };
  }
}
