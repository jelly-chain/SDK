/**
 * Social Media Sentiment Provider
 * Twitter/Reddit buzz as a signal — player drama, coaching changes, locker room issues.
 */

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'discord' | 'telegram';
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  shares: number;
  replies: number;
  isVerified: boolean;
  isOfficial: boolean;
}

export interface SentimentResult {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  volume: number; // Number of posts analyzed
  direction: 'bullish' | 'bearish' | 'neutral';
  topKeywords: string[];
  influentialPosts: SocialPost[];
}

export interface TeamSentiment {
  teamId: string;
  overall: SentimentResult;
  coaching: SentimentResult;
  roster: SentimentResult;
  injuries: SentimentResult;
  drama: SentimentResult;
  trends: {
    hourly: number[];
    daily: number[];
  };
  alerts: SentimentAlert[];
}

export interface SentimentAlert {
  type: 'spike' | 'crash' | 'drama' | 'injury-report' | 'trade-rumor' | 'coaching-change';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  source: string;
}

export interface PlayerSentiment {
  playerId: string;
  playerName: string;
  sentiment: SentimentResult;
  dramaFlags: string[];
  trendingTopics: string[];
}

const POSITIVE_KEYWORDS = [
  'great', 'amazing', 'incredible', 'dominant', 'clutch', 'elite', 'MVP',
  'unstoppable', 'legendary', 'GOAT', 'fire', 'lit', 'beast', 'monster',
  'breakout', 'explosive', 'phenomenal', 'historic', 'record', 'champion',
];

const NEGATIVE_KEYWORDS = [
  'terrible', 'awful', 'bust', 'washed', 'trash', 'overrated', 'choker',
  'injured', 'hurt', 'drama', 'conflict', 'benched', 'suspended', 'arrested',
  'disappointing', 'pathetic', 'collapse', 'choke', 'embarrassing', 'fraud',
];

const DRAMA_KEYWORDS = [
  'trade request', 'unhappy', 'wants out', 'locker room', 'beef', 'feud',
  'suspended', 'arrested', 'DUI', 'violation', 'controversy', 'scandal',
  'holdout', 'contract dispute', 'fired', 'resigned', 'mutiny', 'quit',
];

export class SocialSentimentAnalyzer {
  private posts: Map<string, SocialPost[]> = new Map();

  /** Register posts for a topic */
  addPosts(topic: string, posts: SocialPost[]): void {
    const existing = this.posts.get(topic) ?? [];
    existing.push(...posts);
    this.posts.set(topic, existing);
  }

  /** Analyze sentiment for a topic */
  analyzeSentiment(topic: string): SentimentResult {
    const posts = this.posts.get(topic) ?? [];
    if (posts.length === 0) {
      return { score: 0, magnitude: 0, volume: 0, direction: 'neutral', topKeywords: [], influentialPosts: [] };
    }

    let totalScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    const keywordCounts: Record<string, number> = {};

    for (const post of posts) {
      const lower = post.content.toLowerCase();

      // Count positive/negative keywords
      let postScore = 0;
      for (const keyword of POSITIVE_KEYWORDS) {
        if (lower.includes(keyword.toLowerCase())) {
          postScore += 1;
          positiveCount++;
          keywordCounts[keyword] = (keywordCounts[keyword] ?? 0) + 1;
        }
      }
      for (const keyword of NEGATIVE_KEYWORDS) {
        if (lower.includes(keyword.toLowerCase())) {
          postScore -= 1;
          negativeCount++;
          keywordCounts[keyword] = (keywordCounts[keyword] ?? 0) + 1;
        }
      }

      // Weight by engagement
      const engagement = post.likes + post.shares * 2 + post.replies;
      const weight = Math.min(3, 1 + Math.log10(engagement + 1));

      // Verified accounts carry more weight
      const verifiedBoost = post.isVerified ? 1.5 : 1;

      totalScore += postScore * weight * verifiedBoost;
    }

    const normalizedScore = totalScore / (posts.length * 3); // Normalize to -1 to 1
    const magnitude = Math.min(1, (positiveCount + negativeCount) / posts.length);
    const volume = posts.length;

    const direction: SentimentResult['direction'] =
      normalizedScore > 0.1 ? 'bullish' :
      normalizedScore < -0.1 ? 'bearish' : 'neutral';

    // Top keywords
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);

    // Influential posts (high engagement)
    const influentialPosts = [...posts]
      .sort((a, b) => (b.likes + b.shares * 2) - (a.likes + a.shares * 2))
      .slice(0, 3);

    return { score: normalizedScore, magnitude, volume, direction, topKeywords, influentialPosts };
  }

  /** Detect drama/injury spikes */
  detectAlerts(topic: string): SentimentAlert[] {
    const posts = this.posts.get(topic) ?? [];
    const alerts: SentimentAlert[] = [];

    for (const post of posts) {
      const lower = post.content.toLowerCase();

      // Check for drama keywords
      for (const keyword of DRAMA_KEYWORDS) {
        if (lower.includes(keyword.toLowerCase())) {
          const severity = post.isVerified ? 'critical' : post.likes > 1000 ? 'warning' : 'info';
          alerts.push({
            type: keyword.includes('injured') || keyword.includes('hurt') ? 'injury-report' :
                  keyword.includes('trade') ? 'trade-rumor' :
                  keyword.includes('fired') || keyword.includes('resigned') ? 'coaching-change' : 'drama',
            message: `Detected "${keyword}" in post by ${post.author}: "${post.content.slice(0, 100)}..."`,
            severity,
            timestamp: post.timestamp,
            source: post.platform,
          });
        }
      }
    }

    return alerts;
  }

  /** Get volume spike detection */
  detectVolumeSpike(topic: string, windowMinutes = 60): {
    isSpike: boolean;
    currentVolume: number;
    averageVolume: number;
    spikeMagnitude: number;
  } {
    const posts = this.posts.get(topic) ?? [];
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    const recentPosts = posts.filter((p) => new Date(p.timestamp) >= windowStart);
    const olderPosts = posts.filter((p) => new Date(p.timestamp) < windowStart);

    const currentVolume = recentPosts.length;
    const averageVolume = olderPosts.length > 0 ? olderPosts.length / 10 : 1; // Rough average
    const spikeMagnitude = currentVolume / Math.max(1, averageVolume);

    return {
      isSpike: spikeMagnitude > 2,
      currentVolume,
      averageVolume: Math.round(averageVolume),
      spikeMagnitude: Math.round(spikeMagnitude * 10) / 10,
    };
  }

  /** Analyze player-specific sentiment */
  analyzePlayerSentiment(playerName: string): PlayerSentiment | null {
    const posts = this.posts.get(playerName) ?? [];
    if (posts.length === 0) return null;

    const sentiment = this.analyzeSentiment(playerName);
    const dramaFlags: string[] = [];

    for (const post of posts) {
      const lower = post.content.toLowerCase();
      for (const keyword of DRAMA_KEYWORDS) {
        if (lower.includes(keyword.toLowerCase()) && !dramaFlags.includes(keyword)) {
          dramaFlags.push(keyword);
        }
      }
    }

    // Trending topics
    const topicCounts: Record<string, number> = {};
    for (const post of posts) {
      const words = post.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4) {
          topicCounts[word] = (topicCounts[word] ?? 0) + 1;
        }
      }
    }
    const trendingTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return {
      playerId: playerName,
      playerName,
      sentiment,
      dramaFlags,
      trendingTopics,
    };
  }
}
