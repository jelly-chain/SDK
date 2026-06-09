import { PriceData } from "../types.js";
export class BinanceSource { async getPrice(symbol: string): Promise<PriceData> { return { source: "binance", token: symbol, price: "0", timestamp: Date.now(), confidence: 0.95 }; } async getPrices(symbols: string[]): Promise<PriceData[]> { return symbols.map(s => ({ source: "binance", token: s, price: "0", timestamp: Date.now(), confidence: 0.95 })); } }
