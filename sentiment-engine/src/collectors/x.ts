import { SentimentScore } from "../types.js";
export class XCollector { async collect(_query: string): Promise<SentimentScore[]> { return [{ platform: "x", score: 0, volume: 0, timestamp: Date.now() }]; } }
