import { SentimentScore } from "../types.js";
export class RedditCollector { async collect(_subreddit: string): Promise<SentimentScore[]> { return [{ platform: "reddit", score: 0, volume: 0, timestamp: Date.now() }]; } }
