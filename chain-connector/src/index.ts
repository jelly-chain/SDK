/**
 * @jellychain/chain-connector — Unified RPC connector for 20+ blockchain networks
 */

export { ChainConnector, type ChainConnectorConfig } from "./connector.js";
export type {
  BalanceResult, TokenBalanceResult, TransactionResult, LogEntry,
  EventFilter, GasEstimate, BlockInfo, TraceResult, TokenInfo,
} from "./connector.js";
