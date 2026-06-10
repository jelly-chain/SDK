/**
 * SocialConnector — unified social media data aggregation across Twitter, Reddit, Discord, Telegram
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";
import type {
  SocialPlatform, SocialProfile, SocialPost, SocialSearchResult, SocialTimeline,
  AggregateSentiment, TokenTrend, SocialMonitorConfig, Engagement, SentimentScore, SentimentLabel,
} from "./types.js";

export interface SocialConnectorConfig extends BaseSDKConfig {
  twitterBearerToken?: string;
  redditClientId?: string;
  redditClientSecret?: string;
  discordBotToken?: string;
  telegramBotToken?: string;
  cacheTtl?: number;
}

export class SocialConnector extends BaseSDK {
  private readonly config: SocialConnectorConfig;

  constructor(config: SocialConnectorConfig) {
    super(config, "SocialConnector");
    this.config = config;
  }

  async getTwitterProfile(username: string): Promise<SocialProfile | null> {
    if (!this.config.twitterBearerToken) return null;
    try {
      const data = await this.request<{ data: Record<string, unknown> }>(
        `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,verified,description,profile_image_url`,
        { headers: { Authorization: `Bearer ${this.config.twitterBearerToken}` } }
      );
      const u = data.data;
      return {
        platform: SocialPlatform.TWITTER, id: u.id as string, username: u.username as string,
        displayName: u.name as string, bio: u.description as string,
        followers: (u.public_metrics as Record<string, number>)?.followers_count || 0,
        following: (u.public_metrics as Record<string, number>)?.following_count || 0,
        verified: (u.verified as boolean) || false,
        profileUrl: `https://twitter.com/${username}`,
        avatarUrl: u.profile_image_url as string,
        influenceScore: this.calcInfluenceScore((u.public_metrics as Record<string, number>)?.followers_count || 0),
        metadata: u,
      };
    } catch { return null; }
  }

  async searchTwitter(query: string, maxResults = 50): Promise<SocialSearchResult> {
    if (!this.config.twitterBearerToken) return this.emptySearchResult(query);
    try {
      const data = await this.request<{ data: Record<string, unknown>[]; meta: Record<string, unknown> }>(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=public_metrics,created_at,author_id,entities,lang&expansions=author_id&user.fields=public_metrics,verified`,
        { headers: { Authorization: `Bearer ${this.config.twitterBearerToken}` } }
      );
      const posts = (data.data || []).map(t => this.parseTwitterPost(t));
      const sentiment = this.aggregateSentiment(posts);
      const trendingTokens = this.extractTrendingTokens(posts);
      return { query, posts, profiles: [], totalResults: (data.meta?.result_count as number) || posts.length, sentiment, trendingTokens, fetchedAt: Date.now() };
    } catch { return this.emptySearchResult(query); }
  }

  async getRedditPosts(subreddit: string, sort = "hot", limit = 25): Promise<SocialPost[]> {
    try {
      const data = await this.request<{ data: { children: { data: Record<string, unknown> }[] } }>(
        `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`,
        { headers: { "User-Agent": "JellyChain-SDK/1.0" } }
      );
      return (data.data?.children || []).map(c => this.parseRedditPost(c.data));
    } catch { return []; }
  }

  async getDiscordMessages(channelId: string, limit = 50): Promise<SocialPost[]> {
    if (!this.config.discordBotToken) return [];
    try {
      const data = await this.request<Record<string, unknown>[]>(
        `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`,
        { headers: { Authorization: `Bot ${this.config.discordBotToken}` } }
      );
      return (data || []).map(m => this.parseDiscordMessage(m));
    } catch { return []; }
  }

  async getTelegramChannel(channelUsername: string, limit = 50): Promise<SocialPost[]> {
    if (!this.config.telegramBotToken) return [];
    try {
      const data = await this.request<{ ok: boolean; result: Record<string, unknown>[] }>(
        `https://api.telegram.org/bot${this.config.telegramBotToken}/getChat?chat_id=@${channelUsername}`
      );
      return [];
    } catch { return []; }
  }

  async aggregateSocialScore(tokenSymbol: string): Promise<{
    totalMentions: number; sentiment: AggregateSentiment; influencers: string[];
    platforms: Record<string, number>; trending: boolean; change24h: number;
  }> {
    const [twitterResult] = await Promise.all([
      this.searchTwitter(`$${tokenSymbol}`, 100).catch(() => this.emptySearchResult(tokenSymbol)),
    ]);

    const redditPosts = await this.getRedditPosts("cryptocurrency", "hot", 50).catch(() => [] as SocialPost[]);
    const relevantReddit = redditPosts.filter(p => p.content.toUpperCase().includes(tokenSymbol.toUpperCase()));

    const allPosts = [...twitterResult.posts, ...relevantReddit];
    const sentiment = this.aggregateSentiment(allPosts);
    const influencers = [...new Set(allPosts.filter(p => p.authorFollowers > 10000).map(p => p.authorUsername))].slice(0, 20);

    return {
      totalMentions: allPosts.length,
      sentiment,
      influencers,
      platforms: { twitter: twitterResult.posts.length, reddit: relevantReddit.length, discord: 0, telegram: 0 },
      trending: sentiment.volume > 100 && Math.abs(sentiment.score) > 0.3,
      change24h: sentiment.change24h,
    };
  }

  async trackMention(tokenSymbol: string, callback: (post: SocialPost) => void, intervalMs = 60_000): Promise<() => void> {
    let lastPostId: string | undefined;
    const interval = setInterval(async () => {
      try {
        const result = await this.searchTwitter(`$${tokenSymbol}`, 10);
        const newPosts = lastPostId ? result.posts.filter(p => p.id > lastPostId!) : result.posts;
        for (const post of newPosts) callback(post);
        if (result.posts.length > 0) lastPostId = result.posts[0]!.id;
      } catch { /* ignore errors in polling */ }
    }, intervalMs);
    return () => clearInterval(interval);
  }

  async getTrendingTokens(platform: SocialPlatform = SocialPlatform.TWITTER, limit = 20): Promise<TokenTrend[]> {
    const cashtags = platform === SocialPlatform.TWITTER
      ? await this.searchTwitter("$", 100).catch(() => this.emptySearchResult("$"))
      : this.emptySearchResult("$");
    return cashtingTokens.slice(0, limit);
  }

  // ── Parsers ─────────────────────────────────────────────────────────────

  private parseTwitterPost(raw: Record<string, unknown>): SocialPost {
    const metrics = raw.public_metrics as Record<string, number> || {};
    const entities = raw.entities as Record<string, unknown> || {};
    const mentions = ((entities.mentions as Record<string, string>[]) || []).map(m => m.username || "");
    const hashtags = ((entities.hashtags as Record<string, string>[]) || []).map(h => h.tag || "");
    const urls = ((entities.urls as Record<string, string>[]) || []).map(u => u.expanded_url || "");
    const cashtags = ((entities.cashtags as Record<string, string>[]) || []).map(c => c.tag || "");

    return {
      id: raw.id as string, platform: SocialPlatform.TWITTER,
      authorId: (raw.author_id as string) || "", authorUsername: "", authorFollowers: 0, authorVerified: false,
      content: (raw.text as string) || "", type: PostType.TEXT,
      createdAt: new Date(raw.created_at as string).getTime(),
      engagement: {
        likes: metrics.like_count || 0, reposts: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0, quotes: metrics.quote_count || 0,
        views: metrics.impression_count || 0, bookmarks: 0,
        score: (metrics.like_count || 0) + (metrics.retweet_count || 0) * 2 + (metrics.reply_count || 0) * 3,
      },
      mentions, hashtags, urls,
      tokenMentions: cashtags.map(tag => ({ symbol: tag, sentiment: 0, context: "", isPromoted: false })),
      language: (raw.lang as string) || "en",
      metadata: raw,
    };
  }

  private parseRedditPost(raw: Record<string, unknown>): SocialPost {
    return {
      id: raw.id as string, platform: SocialPlatform.REDDIT,
      authorId: raw.author as string, authorUsername: raw.author as string,
      authorFollowers: 0, authorVerified: false,
      content: `${raw.title || ""} ${raw.selftext || ""}`.trim(),
      type: PostType.TEXT, createdAt: (raw.created_utc as number) * 1000,
      engagement: {
        likes: raw.ups as number || 0, reposts: 0, replies: raw.num_comments as number || 0,
        quotes: 0, views: 0, bookmarks: raw.saved as number || 0,
        score: (raw.ups as number || 0) + (raw.num_comments as number || 0) * 2,
      },
      mentions: [], hashtags: [], urls: [],
      tokenMentions: this.extractTokenMentionsFromText(`${raw.title || ""} ${raw.selftext || ""}`),
      language: "en", metadata: raw,
    };
  }

  private parseDiscordMessage(raw: Record<string, unknown>): SocialPost {
    return {
      id: raw.id as string, platform: SocialPlatform.DISCORD,
      authorId: (raw.author as Record<string, unknown>)?.id as string || "",
      authorUsername: (raw.author as Record<string, unknown>)?.username as string || "",
      authorFollowers: 0, authorVerified: false,
      content: (raw.content as string) || "", type: PostType.TEXT,
      createdAt: new Date(raw.timestamp as string).getTime(),
      engagement: { likes: 0, reposts: 0, replies: 0, quotes: 0, views: 0, bookmarks: 0, score: 0 },
      mentions: [], hashtags: [], urls: [],
      tokenMentions: this.extractTokenMentionsFromText(raw.content as string || ""),
      language: "en", metadata: raw,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private calcInfluenceScore(followers: number): number {
    if (followers > 1_000_000) return 100;
    if (followers > 100_000) return 80 + (followers - 100_000) / 900_000 * 20;
    if (followers > 10_000) return 60 + (followers - 10_000) / 90_000 * 20;
    if (followers > 1_000) return 40 + (followers - 1_000) / 9_000 * 20;
    if (followers > 100) return 20 + (followers - 100) / 900 * 20;
    return followers / 100 * 20;
  }

  private aggregateSentiment(posts: SocialPost[]): AggregateSentiment {
    if (posts.length === 0) return { overall: SentimentLabel.NEUTRAL, score: 0, volume: 0, bullishPercent: 0, bearishPercent: 0, neutralPercent: 100, change24h: 0 };
    const scores = posts.map(p => p.sentiment?.score || 0).filter(s => s !== 0);
    const avg = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    const bullish = scores.filter(s => s > 0.2).length;
    const bearish = scores.filter(s => s < -0.2).length;
    const total = scores.length || 1;
    let overall: SentimentLabel;
    if (avg > 0.5) overall = SentimentLabel.VERY_BULLISH;
    else if (avg > 0.2) overall = SentimentLabel.BULLISH;
    else if (avg < -0.5) overall = SentimentLabel.VERY_BEARISH;
    else if (avg < -0.2) overall = SentimentLabel.BEARISH;
    else overall = SentimentLabel.NEUTRAL;
    return { overall, score: avg, volume: posts.length, bullishPercent: bullish / total * 100, bearishPercent: bearish / total * 100, neutralPercent: (total - bullish - bearish) / total * 100, change24h: 0 };
  }

  private extractTrendingTokens(posts: SocialPost[]): TokenTrend[] {
    const tokenCounts = new Map<string, { count: number; sentiment: number; influencers: Set<string> }>();
    for (const post of posts) {
      for (const mention of post.tokenMentions) {
        const existing = tokenCounts.get(mention.symbol) || { count: 0, sentiment: 0, influencers: new Set() };
        existing.count++;
        existing.sentiment += mention.sentiment;
        if (post.authorFollowers > 10000) existing.influencers.add(post.authorUsername);
        tokenCounts.set(mention.symbol, existing);
      }
    }
    return [...tokenCounts.entries()]
      .map(([symbol, data]) => ({ symbol, mentions: data.count, change24h: 0, sentiment: data.sentiment / data.count, influencers: [...data.influencers] }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 20);
  }

  private extractTokenMentionsFromText(text: string): { symbol: string; sentiment: number; context: string; isPromoted: boolean }[] {
    const matches: { symbol: string; sentiment: number; context: string; isPromoted: boolean }[] = [];
    const cashtagPattern = /\$([A-Z]{2,10})\b/g;
    let m: RegExpExecArray | null;
    while ((m = cashtagPattern.exec(text)) !== null) {
      matches.push({ symbol: m[1]!, sentiment: 0, context: text.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20), isPromoted: false });
    }
    return matches;
  }

  private emptySearchResult(query: string): SocialSearchResult {
    return { query, posts: [], profiles: [], totalResults: 0, sentiment: { overall: SentimentLabel.NEUTRAL, score: 0, volume: 0, bullishPercent: 0, bearishPercent: 0, neutralPercent: 100, change24h: 0 }, trendingTokens: [], fetchedAt: Date.now() };
  }
}
