export enum SocialPlatform { TWITTER = "twitter", REDDIT = "reddit", DISCORD = "discord", TELEGRAM = "telegram", LENS = "lens", FARCASTER = "farcaster", MASTODON = "mastodon", TIKTOK = "tiktok", YOUTUBE = "youtube" }
export enum PostType { TEXT = "text", IMAGE = "image", VIDEO = "video", POLL = "poll", THREAD = "thread", REPOST = "repost", REPLY = "reply" }
export enum SentimentLabel { VERY_BEARISH = "very_bearish", BEARISH = "bearish", NEUTRAL = "neutral", BULLISH = "bullish", VERY_BULLISH = "very_bullish" }

export interface SocialProfile {
  platform: SocialPlatform;
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  followers: number;
  following: number;
  verified: boolean;
  profileUrl: string;
  avatarUrl?: string;
  influenceScore: number;
  lastActivityAt?: number;
  metadata: Record<string, unknown>;
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  authorId: string;
  authorUsername: string;
  authorFollowers: number;
  authorVerified: boolean;
  content: string;
  type: PostType;
  createdAt: number;
  engagement: Engagement;
  sentiment?: SentimentScore;
  mentions: string[];
  hashtags: string[];
  urls: string[];
  tokenMentions: TokenMention[];
  parentPostId?: string;
  repostOfId?: string;
  language: string;
  metadata: Record<string, unknown>;
}

export interface Engagement {
  likes: number;
  reposts: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
  score: number; // weighted engagement score
}

export interface SentimentScore {
  label: SentimentLabel;
  score: number; // -1 to 1
  confidence: number;
  tokens: { symbol: string; sentiment: number }[];
  keywords: string[];
}

export interface TokenMention {
  symbol: string;
  address?: string;
  chainId?: number;
  sentiment: number;
  priceAtMention?: number;
  context: string;
  isPromoted: boolean;
}

export interface SocialSearchResult {
  query: string;
  posts: SocialPost[];
  profiles: SocialProfile[];
  totalResults: number;
  sentiment: AggregateSentiment;
  trendingTokens: TokenTrend[];
  fetchedAt: number;
}

export interface SocialTimeline {
  platform: SocialPlatform;
  posts: SocialPost[];
  lastPostId?: string;
  hasMore: boolean;
  fetchedAt: number;
}

export interface AggregateSentiment {
  overall: SentimentLabel;
  score: number;
  volume: number;
  bullishPercent: number;
  bearishPercent: number;
  neutralPercent: number;
  change24h: number;
}

export interface TokenTrend {
  symbol: string;
  mentions: number;
  change24h: number;
  sentiment: number;
  influencers: string[];
}

export interface SocialMonitorConfig {
  platforms: SocialPlatform[];
  keywords: string[];
  accounts: string[];
  tokens: string[];
  minFollowers: number;
  minEngagement: number;
  languages: string[];
  pollInterval: number;
}
