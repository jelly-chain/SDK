/**
 * @jellychain/price-oracle — Multi-source price feed aggregator
 */

export { PriceOracle, type PriceOracleConfig } from "./oracle.js";
export type {
  PriceSource, PriceSourceType, PriceResult, SourcePrice,
  TWAPResult, PriceAlert,
} from "./oracle.js";
