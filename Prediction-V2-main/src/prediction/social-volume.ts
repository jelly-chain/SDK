/**
 * Social Volume Spike Detector
 * When a token gets 10x mentions, something's happening.
 */

export interface SocialMention {
  id: string;
  platform: 'twitter' | 'reddit' | 'telegram' | 'discord' | 'youtube' | 'tiktok';
  token: string;
  content: string;
  author: string;
  timestamp: string;
  engagement: number; // likes + shares + replies
  isVerified: boolean;
  isBot: boolean;
}

export interface VolumeBaseline {
  token: string;
  platform: string;
  avgHourly: number;
  avgDaily: number;
  stdDevDaily: number;
  last30Days: number[];
}

export interface VolumeSpike {
  id: string;
  token: string;
  platform: string;
  currentVolume: number;
  baselineVolume: number;
  spikeMultiple: number; // e.g. 10x
  duration: number; // hours the spike has been active
  direction: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  topAuthors: string[];
  topContent: string[];
  confidence: number;
  possibleCauses: string[];
}

export interface SocialSignal {
  token: string;
  overallDirection: 'bullish' | 'bearish' | 'neutral';
  volumeSpike: boolean;
  sentimentShift: boolean;
  viralContent: boolean;
  whaleMention: boolean;
  signalStrength: number; // 0-1
  details: string;
  spikes: VolumeSpike[];
}

const BULLISH_PATTERNS = [
  'moon', 'pump', 'bullish', 'buy', 'accumulate', 'hodl', 'diamond hands',
  'breakout', 'rally', 'surge', 'ATH', 'all time high', 'undervalued',
  'gem', 'alpha', 'next 100x', 'send it', 'LFG', 'WAGMI',
];

const BEARISH_PATTERNS = [
  'dump', 'crash', 'rug', 'scam', 'bearish', 'sell', 'short',
  'overvalued', 'baghold', 'rekt', 'exit', 'dead', 'ponzi',
  'fraud', 'trash', 'shitcoin', 'avoid', 'warning', 'red flag',
];

export class SocialVolumeDetector {
  private mentions: Map<string, SocialMention[]> = new Map();
  private baselines: Map<string, VolumeBaseline> = new Map();
  private spikes: VolumeSpike[] = [];

  /** Record a mention */
  recordMention(mention: SocialMention): void {
    const key = `${mention.token}-${mention.platform}`;
    const existing = this.mentions.get(key) ?? [];
    existing.push(mention);
    this.mentions.set(key, existing);

    // Check for spike
    this.checkForSpike(mention);
  }

  /** Record multiple mentions */
  recordMentions(mentions: SocialMention[]): void {
    for (const mention of mentions) this.recordMention(mention);
  }

  /** Set baseline for a token/platform */
  setBaseline(baseline: VolumeBaseline): void {
    this.baselines.set(`${baseline.token}-${baseline.platform}`, baseline);
  }

  /** Check if a mention triggers a spike */
  private checkForSpike(mention: SocialMention): void {
    const key = `${mention.token}-${mention.platform}`;
    const baseline = this.baselines.get(key);
    if (!baseline) return;

    const now = new Date(mention.timestamp);
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Count mentions in last hour
    const recentMentions = (this.mentions.get(key) ?? []).filter(
      (m) => new Date(m.timestamp) >= hourAgo
    );
    const currentHourly = recentMentions.length;

    // Check for spike
    const spikeMultiple = currentHourly / Math.max(1, baseline.avgHourly);

    if (spikeMultiple >= 3) {
      // Analyze sentiment of spike
      const sentiment = this.analyzeSentiment(recentMentions);

      // Find top authors and content
      const sorted = [...recentMentions].sort((a, b) => b.engagement - a.engagement);
      const topAuthors = [...new Set(sorted.slice(0, 5).map((m) => m.author))];
      const topContent = sorted.slice(0, 3).map((m) => m.content.slice(0, 100));

      // Detect possible causes
      const possibleCauses = this.detectCauses(recentMentions);

      const spike: VolumeSpike = {
        id: `spike-${mention.token}-${mention.platform}-${now.getTime()}`,
        token: mention.token,
        platform: mention.platform,
        currentVolume: currentHourly,
        baselineVolume: baseline.avgHourly,
        spikeMultiple: Math.round(spikeMultiple * 10) / 10,
        duration: 1,
        direction: sentiment.direction,
        sentimentScore: sentiment.score,
        topAuthors,
        topContent,
        confidence: Math.min(0.9, 0.5 + Math.log10(spikeMultiple) * 0.3),
        possibleCauses,
      };

      this.spikes.push(spike);
    }
  }

  /** Analyze sentiment of mentions */
  private analyzeSentiment(mentions: SocialMention[]): { score: number; direction: 'bullish' | 'bearish' | 'neutral' } {
    let bullish = 0;
    let bearish = 0;

    for (const mention of mentions) {
      const lower = mention.content.toLowerCase();
      const weight = mention.isVerified ? 2 : mention.isBot ? 0.1 : 1;

      for (const pattern of BULLISH_PATTERNS) {
        if (lower.includes(pattern)) bullish += weight;
      }
      for (const pattern of BEARISH_PATTERNS) {
        if (lower.includes(pattern)) bearish += weight;
      }
    }

    const total = bullish + bearish;
    if (total === 0) return { score: 0.5, direction: 'neutral' };

    const score = bullish / total;
    const direction = score > 0.6 ? 'bullish' : score < 0.4 ? 'bearish' : 'neutral';

    return { score, direction };
  }

  /** Detect possible causes for spike */
  private detectCauses(mentions: SocialMention[]): string[] {
    const causes: string[] = [];
    const allContent = mentions.map((m) => m.content.toLowerCase()).join(' ');

    if (allContent.includes('listing') || allContent.includes('binance') || allContent.includes('coinbase')) {
      causes.push('Possible exchange listing');
    }
    if (allContent.includes('hack') || allContent.includes('exploit') || allContent.includes('stolen')) {
      causes.push('Possible security incident');
    }
    if (allContent.includes('partner') || allContent.includes('collaborate')) {
      causes.push('Possible partnership announcement');
    }
    if (allContent.includes('airdrop') || allContent.includes('claim')) {
      causes.push('Possible airdrop event');
    }
    if (allContent.includes('whale') || allContent.includes('large buy')) {
      causes.push('Whale activity detected');
    }
    if (allContent.includes('pump') || allContent.includes('moon') || allContent.includes('LFG')) {
      causes.push('Coordinated buying / pump');
    }

    if (causes.length === 0) causes.push('Unknown catalyst — investigate further');
    return causes;
  }

  /** Get social signal for a token */
  getSignal(token: string): SocialSignal {
    const allSpikes = this.spikes.filter((s) => s.token === token);
    const recentSpikes = allSpikes.filter(
      (s) => new Date().getTime() - new Date(s.id.split('-').pop() ?? '0').getTime() < 24 * 60 * 60 * 1000
    );

    // Aggregate sentiment
    const allMentions: SocialMention[] = [];
    for (const [key, mentions] of this.mentions) {
      if (key.startsWith(`${token}-`)) {
        allMentions.push(...mentions);
      }
    }

    const sentiment = this.analyzeSentiment(allMentions);

    // Check for viral content
    const viralContent = allMentions.some((m) => m.engagement > 10000);

    // Check for whale/verified mentions
    const whaleMention = allMentions.some((m) => m.isVerified && m.engagement > 5000);

    // Signal strength
    const signalStrength = Math.min(1,
      (recentSpikes.length > 0 ? 0.3 : 0) +
      (sentiment.direction !== 'neutral' ? 0.3 : 0) +
      (viralContent ? 0.2 : 0) +
      (whaleMention ? 0.2 : 0)
    );

    let details = `${allMentions.length} total mentions`;
    if (recentSpikes.length > 0) {
      details += `, ${recentSpikes.length} volume spike(s) detected`;
    }
    if (sentiment.direction !== 'neutral') {
      details += `, sentiment: ${sentiment.direction}`;
    }

    return {
      token,
      overallDirection: sentiment.direction,
      volumeSpike: recentSpikes.length > 0,
      sentimentShift: false, // Would need historical comparison
      viralContent,
      whaleMention,
      signalStrength: Math.round(signalStrength * 100) / 100,
      details,
      spikes: recentSpikes,
    };
  }

  /** Get all spikes */
  getSpikes(token?: string, limit: number = 20): VolumeSpike[] {
    let filtered = [...this.spikes];
    if (token) filtered = filtered.filter((s) => s.token === token);
    return filtered
      .sort((a, b) => b.spikeMultiple - a.spikeMultiple)
      .slice(0, limit);
  }

  /** Scan all tokens for signals */
  scanForSignals(): SocialSignal[] {
    const tokens = new Set<string>();
    for (const key of this.mentions.keys()) {
      tokens.add(key.split('-')[0]);
    }
    return Array.from(tokens)
      .map((token) => this.getSignal(token))
      .filter((s) => s.signalStrength > 0.3)
      .sort((a, b) => b.signalStrength - a.signalStrength);
  }
}
