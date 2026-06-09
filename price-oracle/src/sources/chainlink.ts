import { PriceData } from "../types.js";
export class ChainlinkSource { private FEEDS: Record<string, string> = { ETH: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", BTC: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c" }; async getPrice(feed: string): Promise<PriceData> { return { source: "chainlink", token: feed, price: "0", timestamp: Date.now(), confidence: 0.99 }; } }
