export interface SocialSentimentConfig {
  twitterBearerToken?: string;
  redditClientId?: string;
  redditSecret?: string;
  enabled?: boolean;
}

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'telegram' | 'discord';
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  shares: number;
  replies: number;
  isVerified: boolean;
  isBot: boolean;
}

export interface SentimentResult {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  volume: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  topKeywords: string[];
}

export interface VolumeSpike {
  topic: string;
  platform: string;
  currentVolume: number;
  baselineVolume: number;
  spikeMultiple: number;
  sentiment: SentimentResult;
  timestamp: string;
}

export interface SentimentSignal {
  topic: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  volumeSpike: boolean;
  sentimentShift: boolean;
  details: string;
}
