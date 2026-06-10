/**
 * SocialSentiment — social media sentiment analysis for Twitter/Reddit as trading signals
 * Keyword scoring, bot detection, volume spikes, sentiment shifts
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export interface SocialSentimentConfig extends BaseSDKConfig { twitterBearerToken?: string; redditClientId?: string; redditClientSecret?: string; botDetectionEnabled?: boolean; minAccountAge?: number; minFollowers?: number }
export interface SentimentPost { id: string; platform: string; author: string; authorFollowers: number; authorVerified: boolean; content: string; sentiment: number; confidence: number; timestamp: number; engagement: number; isBot: boolean; tokenMentions: string[] }
export interface SentimentAggregate { token: string; score: number; volume: number; bullishPercent: number; bearishPercent: number; neutralPercent: number; change1h: number; change24h: number; topInfluencers: string[]; trending: boolean; timestamp: number }
export interface VolumeSpike { token: string; currentVolume: number; averageVolume: number; multiplier: number; direction: "bullish" | "bearish" | "mixed"; startTime: number; duration: number }
export interface SentimentShift { token: string; previousScore: number; currentScore: number; change: number; timeframe: number; trigger: string; confidence: number }

export class SocialSentimentAnalyzer extends BaseSDK {
  private readonly twitterToken?: string;
  private posts: SentimentPost[] = [];
  private history: Map<string, Array<{ score: number; volume: number; timestamp: number }>> = new Map();

  constructor(config: SocialSentimentConfig) {
    super(config, "SocialSentiment");
    this.twitterToken = config.twitterBearerToken;
  }

  async analyzeToken(token: string, timeframe = 86400000): Promise<SentimentAggregate> {
    const posts = await this.fetchPosts(token, timeframe);
    const scores = posts.map(p => p.sentiment);
    const avg = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    const bullish = scores.filter(s => s > 0.2).length;
    const bearish = scores.filter(s => s < -0.2).length;
    const total = scores.length || 1;
    const influencers = [...new Set(posts.filter(p => p.authorFollowers > 10000 && !p.isBot).map(p => p.author))].slice(0, 10);
    this.recordHistory(token, avg, posts.length);
    return { token, score: avg, volume: posts.length, bullishPercent: bullish / total * 100, bearishPercent: bearish / total * 100, neutralPercent: (total - bullish - bearish) / total * 100, change1h: 0, change24h: this.calcChange(token, 86400000), topInfluencers: influencers, trending: posts.length > 100 && Math.abs(avg) > 0.3, timestamp: Date.now() };
  }

  async detectVolumeSpike(token: string, lookbackHours = 24): Promise<VolumeSpike | null> {
    const current = await this.fetchPosts(token, 3600000);
    const historical = await this.fetchPosts(token, lookbackHours * 3600000);
    const avgPerHour = historical.length / lookbackHours;
    const multiplier = avgPerHour > 0 ? current.length / avgPerHour : 0;
    if (multiplier < 2) return null;
    const avgSentiment = current.reduce((s, p) => s + p.sentiment, 0) / Math.max(1, current.length);
    return { token, currentVolume: current.length, averageVolume: Math.round(avgPerHour), multiplier, direction: avgSentiment > 0.1 ? "bullish" : avgSentiment < -0.1 ? "bearish" : "mixed", startTime: Date.now(), duration: 3600000 };
  }

  async detectSentimentShift(token: string, timeframe = 3600000): Promise<SentimentShift | null> {
    const recent = await this.fetchPosts(token, timeframe);
    const older = await this.fetchPosts(token, timeframe * 2).then(p => p.slice(-(p.length - recent.length)));
    if (recent.length === 0 || older.length === 0) return null;
    const recentAvg = recent.reduce((s, p) => s + p.sentiment, 0) / recent.length;
    const olderAvg = older.reduce((s, p) => s + p.sentiment, 0) / older.length;
    const change = recentAvg - olderAvg;
    if (Math.abs(change) < 0.1) return null;
    return { token, previousScore: olderAvg, currentScore: recentAvg, change, timeframe, trigger: change > 0 ? "Positive sentiment shift" : "Negative sentiment shift", confidence: Math.min(0.9, Math.abs(change) * 2) };
  }

  async getInfluencerSentiment(token: string, minFollowers = 50000): Promise<{ influencer: string; followers: number; sentiment: number; posts: number; impact: number }[]> {
    const posts = (await this.fetchPosts(token, 86400000)).filter(p => p.authorFollowers >= minFollowers && !p.isBot);
    const byInfluencer = new Map<string, { followers: number; sentiments: number[] }>();
    for (const p of posts) { const e = byInfluencer.get(p.author) || { followers: p.authorFollowers, sentiments: [] }; e.sentiments.push(p.sentiment); byInfluencer.set(p.author, e); }
    return [...byInfluencer.entries()].map(([inf, data]) => ({ influencer: inf, followers: data.followers, sentiment: data.sentiments.reduce((s, v) => s + v, 0) / data.sentiments.length, posts: data.sentiments.length, impact: data.followers * Math.abs(data.sentiments.reduce((s, v) => s + v, 0) / data.sentiments.length) })).sort((a, b) => b.impact - a.impact).slice(0, 20);
  }

  isBot(author: { followers: number; following: number; accountAge: number; verified: boolean; postFrequency: number }): boolean {
    if (author.verified) return false;
    if (author.followers < 10 && author.following > 1000) return true;
    if (author.accountAge < 30) return true;
    if (author.postFrequency > 100) return true;
    if (author.followers > 0 && author.following / author.followers > 10) return true;
    return false;
  }

  calculateSocialScore(posts: SentimentPost[]): number {
    let weightedSum = 0, totalWeight = 0;
    for (const post of posts) {
      if (post.isBot) continue;
      const weight = Math.log10(Math.max(10, post.authorFollowers)) * (post.authorVerified ? 2 : 1) * Math.log10(Math.max(1, post.engagement + 1));
      weightedSum += post.sentiment * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private async fetchPosts(token: string, timeframe: number): Promise<SentimentPost[]> { return []; }
  private recordHistory(token: string, score: number, volume: number): void { if (!this.history.has(token)) this.history.set(token, []); this.history.get(token)!.push({ score, volume, timestamp: Date.now() }); }
  private calcChange(token: string, timeframe: number): number { const h = this.history.get(token) || []; if (h.length < 2) return 0; const recent = h.slice(-Math.min(10, h.length)); const older = h.slice(0, Math.max(1, h.length - 10)); const rAvg = recent.reduce((s, v) => s + v.score, 0) / recent.length; const oAvg = older.reduce((s, v) => s + v.score, 0) / older.length; return rAvg - oAvg; }
}
