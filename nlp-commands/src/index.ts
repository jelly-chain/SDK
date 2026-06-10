/**
 * @jellychain/nlp-commands — Natural Language to Trading Commands Parser
 *
 * Converts free-text human language into structured trading commands
 * that agents can execute. Supports English, Chinese, Spanish, Japanese.
 *
 * @example
 *   import { NLParser, EntityExtractor } from "@jellychain/nlp-commands";
 *
 *   const parser = new NLParser({ defaultChain: "ethereum" });
 *   const result = parser.parse("Buy 0.5 ETH on Uniswap if price drops below $2000");
 *   // result.commands[0] => { action: "BUY", tokenOut: { symbol: "ETH", ... }, amount: 0.5, ... }
 */

export { NLParser } from "./parser.js";
export { EntityExtractor } from "./extractor.js";
export type {
  ParseResult, TradingCommand, ExtractedEntity, ParserConfig,
  ActionType, Condition, TokenRef, ChainType, VenueType,
  ConditionType, TokenBalance, CommandTemplate, LanguagePack,
  BatchParseResult, ValidationResult, ValidationError, ValidationWarning,
} from "./types.js";
