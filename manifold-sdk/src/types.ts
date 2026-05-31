export interface ManifoldConfig {
  apiKey?: string;
  baseUrl?: string;
  enabled?: boolean;
}

export interface ManifoldMarket {
  id: string;
  creatorId: string;
  creatorName: string;
  createdTime: number;
  lastUpdatedTime: number;
  closeTime?: number;
  question: string;
  slug: string;
  url: string;
  outcomeType: 'BINARY' | 'MULTIPLE_CHOICE' | 'FREE_RESPONSE' | 'PSEUDO_NUMERIC' | 'POLL';
  probability: number;
  p?: number;
  totalLiquidity: number;
  volume: number;
  volume24Hours: number;
  isResolved: boolean;
  resolution?: string;
  resolutionTime?: number;
  resolutionProbability?: number;
  tags: string[];
  visibility: 'public' | 'unlisted';
  groupSlugs?: string[];
}

export interface ManifoldBet {
  id: string;
  userId: string;
  contractId: string;
  createdTime: number;
  amount: number;
  outcome: string;
  probBefore: number;
  probAfter: number;
  sale?: {
    amount: number;
    betId: string;
  };
  isAnte: boolean;
  isLiquidityProvision: boolean;
}

export interface ManifoldUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  createdTime: number;
  profitCached: {
    daily: number;
    weekly: number;
    monthly: number;
    allTime: number;
  };
  totalDeposits: number;
  totalPnL: number;
}

export interface CalibrationData {
  bucket: number; // 0-100
  predicted: number;
  actual: number;
  count: number;
}
