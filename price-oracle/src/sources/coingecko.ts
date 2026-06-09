import { PriceData } from "../types.js";
export class CoinGeckoSource { async getPrice(tokenId: string): Promise<PriceData> { return { source: "coingecko", token: tokenId, price: "0", timestamp: Date.now(), confidence: 0.9 }; } }
