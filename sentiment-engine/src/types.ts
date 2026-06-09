export type Platform = "x" | "reddit" | "discord" | "telegram" | "news" | "on-chain";
export interface SentimentScore { platform: Platform; score: number; volume: number; timestamp: number; }
export interface AggregatedSentiment { overall: number; bullish: number; bearish: number; neutral: number; volume: number; trend: "improving" | "declining" | "stable"; breakdown: Record<Platform, SentimentScore>; }
export interface TrendData { name: string; sentiment: number; volume: number; momentum: number; tokens: string[]; startTime: number; }
