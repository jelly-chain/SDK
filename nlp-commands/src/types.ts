/**
 * @jellychain/nlp-commands — Natural Language to Trading Commands Parser
 *
 * Converts free-text human language into structured trading commands
 * that agents can execute. Supports English, Chinese, Spanish, Japanese.
 *
 * @example
 *   parse("Buy 0.5 ETH on Uniswap if price drops below $2000")
 *   // => { action: "BUY", token: "ETH", amount: 0.5, venue: "uniswap", condition: { type: "price_below", value: 2000 } }
 */

// ── Core Types ──────────────────────────────────────────────────────────────

export type ActionType =
  | "BUY" | "SELL" | "SWAP" | "BRIDGE" | "STAKE" | "UNSTAKE"
  | "CLAIM" | "APPROVE" | "CANCEL" | "LIMIT_BUY" | "LIMIT_SELL"
  | "STOP_LOSS" | "TAKE_PROFIT" | "DCA" | "REBALANCE" | "HARVEST"
  | "LEND" | "BORROW" | "REPAY" | "LIQUIDATE" | "SHORT" | "LONG"
  | "CLOSE" | "ROLL" | "TRANSFER" | "WRAP" | "UNWRAP";

export type ChainType =
  | "ethereum" | "bsc" | "polygon" | "arbitrum" | "optimism" | "base"
  | "avalanche" | "solana" | "sui" | "ton" | "bitcoin" | "tron"
  | "linea" | "scroll" | "zksync" | "mantle" | "blast" | "sei"
  | "aptos" | "near" | "cosmos" | "osmosis" | "injective";

export type VenueType =
  | "uniswap" | "sushiswap" | "pancakeswap" | "curve" | "balancer"
  | "jupiter" | "raydium" | "orca" | "lifinity" | "meteora"
  | "odos" | "1inch" | "cowswap" | "paraswap" | "kyber"
  | "gmx" | "dydx" | "hyperliquid" | "vertex" | "orderly"
  | "polymarket" | "kalshi" | "betfair" | "manifold";

export type ConditionType =
  | "price_above" | "price_below" | "price_between"
  | "volume_above" | "volume_below"
  | "change_above" | "change_below"
  | "time_after" | "time_before" | "time_between"
  | "gas_below" | "slippage_below"
  | "liquidity_above" | "market_cap_above" | "market_cap_below"
  | "rsi_above" | "rsi_below"
  | "macd_cross_above" | "macd_cross_below"
  | "whale_buy" | "whale_sell"
  | "social_sentiment_above" | "social_sentiment_below"
  | "news_positive" | "news_negative"
  | "funding_rate_above" | "funding_rate_below"
  | "open_interest_above" | "tvl_above"
  | "custom";

export interface Condition {
  type: ConditionType;
  value?: number;
  valueMin?: number;
  valueMax?: number;
  token?: string;
  chain?: ChainType;
  venue?: VenueType;
  timeframe?: string;
  customExpression?: string;
}

export interface TokenRef {
  symbol: string;
  address?: string;
  chain?: ChainType;
  decimals?: number;
}

export interface TradingCommand {
  id: string;
  action: ActionType;
  tokenIn?: TokenRef;
  tokenOut?: TokenRef;
  amount?: number;
  amountType?: "absolute" | "percentage" | "all";
  amountToken?: string;
  venue?: VenueType;
  chain?: ChainType;
  chainOut?: ChainType;
  conditions?: Condition[];
  slippage?: number;
  deadline?: number;
  gasLimit?: number;
  maxGasPrice?: number;
  referrer?: string;
  recipient?: string;
  metadata?: Record<string, unknown>;
  raw: string;
  confidence: number;
  language: string;
  parsed: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ParseResult {
  commands: TradingCommand[];
  intent: string;
  entities: ExtractedEntity[];
  confidence: number;
  language: string;
  raw: string;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ExtractedEntity {
  type: "token" | "amount" | "chain" | "venue" | "condition" | "action" | "time" | "address" | "percentage";
  value: string;
  normalized: string;
  confidence: number;
  start: number;
  end: number;
}

export interface ParserConfig {
  defaultChain?: ChainType;
  defaultSlippage?: number;
  defaultDeadline?: number;
  maxGasPrice?: number;
  supportedLanguages?: string[];
  customTokenMap?: Record<string, TokenRef>;
  customVenueMap?: Record<string, VenueType>;
  strictMode?: boolean;
  expandShorthand?: boolean;
  inferMissing?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  command?: TradingCommand;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface CommandTemplate {
  pattern: string;
  regex: RegExp;
  action: ActionType;
  extract: (match: RegExpMatchArray, raw: string) => Partial<TradingCommand>;
  examples: string[];
}

export interface LanguagePack {
  code: string;
  name: string;
  actions: Record<string, ActionType>;
  prepositions: Record<string, string>;
  conjunctions: string[];
  conditionWords: Record<string, ConditionType>;
  numberWords: Record<string, number>;
  shorthand: Record<string, string>;
}

export interface BatchParseResult {
  results: ParseResult[];
  totalCommands: number;
  totalErrors: number;
  totalWarnings: number;
  byAction: Record<ActionType, number>;
  byChain: Record<ChainType, number>;
  byVenue: Record<VenueType, number>;
}
