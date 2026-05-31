/**
 * News Event Classification Pipeline
 * Auto-categorize news as bullish/bearish/neutral for tokens.
 */

export type NewsCategory = 'bullish' | 'bearish' | 'neutral' | 'mixed';
export type NewsEventType =
  | 'partnership' | 'launch' | 'listing' | 'airdrop' | 'upgrade' | 'hack' | 'rug-pull'
  | 'regulation' | 'adoption' | 'whale-movement' | 'governance' | 'funding' | 'acquisition'
  | 'bug' | 'downtime' | 'milestone' | 'competition' | 'endorsement' | 'ban';

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  url: string;
  publishedAt: string;
  tokens: string[];
  sentiment?: number;
}

export interface NewsClassification {
  newsId: string;
  category: NewsCategory;
  eventType: NewsEventType;
  confidence: number;
  impactScore: number; // -1 to 1
  affectedTokens: string[];
  timeHorizon: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  factors: string[];
  historicalComparison?: {
    similarEvent: string;
    priceImpact: number;
    timeframe: string;
  };
}

export interface NewsFilter {
  tokens?: string[];
  categories?: NewsCategory[];
  eventTypes?: NewsEventType[];
  minImpactScore?: number;
  sources?: string[];
  since?: string;
}

const EVENT_KEYWORDS: Record<NewsEventType, string[]> = {
  'partnership': ['partner', 'partnership', 'collaborate', 'alliance', 'integrate', 'integration'],
  'launch': ['launch', 'mainnet', 'testnet', 'deploy', 'go live', 'release'],
  'listing': ['listing', 'listed', 'exchange', 'binance', 'coinbase', 'kraken'],
  'airdrop': ['airdrop', 'claim', 'free tokens', 'distribution'],
  'upgrade': ['upgrade', 'hard fork', 'soft fork', 'v2', 'v3', 'improvement'],
  'hack': ['hack', 'exploit', 'stolen', 'breach', 'vulnerability', 'drained'],
  'rug-pull': ['rug', 'rug pull', 'scam', 'exit scam', 'abandoned'],
  'regulation': ['sec', 'cftc', 'regulation', 'ban', 'legal', 'lawsuit', 'compliance'],
  'adoption': ['adopt', 'adoption', 'real world', 'enterprise', 'institutional'],
  'whale-movement': ['whale', 'large transfer', 'accumulation', 'sell off', 'dump'],
  'governance': ['proposal', 'vote', 'governance', 'dao', 'delegate'],
  'funding': ['funding', 'raise', 'series', 'investor', 'valuation'],
  'acquisition': ['acquire', 'acquisition', 'merger', 'buyout'],
  'bug': ['bug', 'glitch', 'error', 'issue', 'problem'],
  'downtime': ['down', 'outage', 'downtime', 'offline', 'unavailable'],
  'milestone': ['milestone', 'record', 'all-time', 'ATH', 'achievement'],
  'competition': ['competitor', 'rival', 'alternative', 'flippening'],
  'endorsement': ['endorse', 'support', 'back', 'praise', 'recommend'],
  'ban': ['ban', 'prohibited', 'illegal', 'restricted', 'blacklist'],
};

const CATEGORY_PATTERNS: Record<NewsEventType, NewsCategory> = {
  'partnership': 'bullish',
  'launch': 'bullish',
  'listing': 'bullish',
  'airdrop': 'bullish',
  'upgrade': 'bullish',
  'hack': 'bearish',
  'rug-pull': 'bearish',
  'regulation': 'bearish',
  'adoption': 'bullish',
  'whale-movement': 'mixed',
  'governance': 'neutral',
  'funding': 'bullish',
  'acquisition': 'bullish',
  'bug': 'bearish',
  'downtime': 'bearish',
  'milestone': 'bullish',
  'competition': 'mixed',
  'endorsement': 'bullish',
  'ban': 'bearish',
};

const IMPACT_SCORES: Record<NewsEventType, number> = {
  'partnership': 0.4,
  'launch': 0.5,
  'listing': 0.6,
  'airdrop': 0.3,
  'upgrade': 0.4,
  'hack': -0.7,
  'rug-pull': -0.9,
  'regulation': -0.5,
  'adoption': 0.5,
  'whale-movement': 0.2,
  'governance': 0.1,
  'funding': 0.4,
  'acquisition': 0.5,
  'bug': -0.3,
  'downtime': -0.4,
  'milestone': 0.3,
  'competition': -0.2,
  'endorsement': 0.3,
  'ban': -0.6,
};

export class NewsClassifier {
  private classifications: Map<string, NewsClassification> = new Map();

  /** Classify a news item */
  classify(news: NewsItem): NewsClassification {
    const lower = `${news.title} ${news.body}`.toLowerCase();

    // Detect event type
    let bestEventType: NewsEventType = 'milestone';
    let bestScore = 0;

    for (const [eventType, keywords] of Object.entries(EVENT_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestEventType = eventType as NewsEventType;
      }
    }

    // Category from event type
    const category = CATEGORY_PATTERNS[bestEventType];
    const baseImpact = IMPACT_SCORES[bestEventType];

    // Adjust impact based on sentiment if available
    let impactScore = baseImpact;
    if (news.sentiment !== undefined) {
      impactScore = (baseImpact + news.sentiment) / 2;
    }

    // Confidence based on keyword match strength
    const confidence = Math.min(0.95, bestScore / 5);

    // Time horizon
    const timeHorizon: NewsClassification['timeHorizon'] =
      bestEventType === 'hack' || bestEventType === 'listing' ? 'immediate' :
      bestEventType === 'partnership' || bestEventType === 'launch' ? 'short-term' :
      bestEventType === 'adoption' || bestEventType === 'regulation' ? 'medium-term' :
      'long-term';

    // Factors
    const factors: string[] = [];
    if (bestEventType === 'listing') factors.push('Exchange listing historically causes price pump');
    if (bestEventType === 'hack') factors.push('Security breach — expect selling pressure');
    if (bestEventType === 'partnership') factors.push('Partnership announcement — bullish catalyst');
    if (news.tokens.length > 0) factors.push(`Affects: ${news.tokens.join(', ')}`);

    const classification: NewsClassification = {
      newsId: news.id,
      category,
      eventType: bestEventType,
      confidence,
      impactScore: Math.round(impactScore * 100) / 100,
      affectedTokens: news.tokens,
      timeHorizon,
      factors,
    };

    this.classifications.set(news.id, classification);
    return classification;
  }

  /** Classify multiple news items */
  classifyMany(newsItems: NewsItem[]): NewsClassification[] {
    return newsItems.map((n) => this.classify(n));
  }

  /** Get classifications by filter */
  filter(filter: NewsFilter): NewsClassification[] {
    const results: NewsClassification[] = [];
    for (const classification of this.classifications.values()) {
      if (filter.categories && !filter.categories.includes(classification.category)) continue;
      if (filter.eventTypes && !filter.eventTypes.includes(classification.eventType)) continue;
      if (filter.minImpactScore && Math.abs(classification.impactScore) < filter.minImpactScore) continue;
      if (filter.tokens && !filter.tokens.some((t) => classification.affectedTokens.includes(t))) continue;
      results.push(classification);
    }
    return results;
  }

  /** Get aggregate sentiment for a token */
  getTokenSentiment(token: string): {
    bullish: number;
    bearish: number;
    neutral: number;
    overall: NewsCategory;
    topEvents: NewsClassification[];
  } {
    const relevant = Array.from(this.classifications.values())
      .filter((c) => c.affectedTokens.includes(token));

    const bullish = relevant.filter((c) => c.category === 'bullish').length;
    const bearish = relevant.filter((c) => c.category === 'bearish').length;
    const neutral = relevant.filter((c) => c.category === 'neutral').length;

    const overall: NewsCategory =
      bullish > bearish * 1.5 ? 'bullish' :
      bearish > bullish * 1.5 ? 'bearish' : 'neutral';

    const topEvents = relevant
      .sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore))
      .slice(0, 5);

    return { bullish, bearish, neutral, overall, topEvents };
  }
}
