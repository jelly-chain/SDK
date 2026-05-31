export interface ProtocolConfig {
  gnosisRpcUrl?: string;
  augurRpcUrl?: string;
  chainId?: number;
  enabled?: boolean;
}

export interface ConditionalToken {
  id: string;
  conditionId: string;
  outcomeSlotCount: number;
  parentCollectionId?: string;
  collectionId: string;
}

export interface PredictionProtocolMarket {
  id: string;
  protocol: 'gnosis' | 'augur' | 'polymarket';
  question: string;
  outcomes: string[];
  resolved: boolean;
  winningOutcome?: string;
  liquidity: number;
  volume: number;
  createdAt: string;
  endDate?: string;
  oracle: string;
  collateralToken: string;
}

export interface SettlementInfo {
  marketId: string;
  protocol: string;
  status: 'pending' | 'disputed' | 'settled';
  winningOutcome?: string;
  settlementTime?: string;
  disputeWindow?: string;
  oracleAddress: string;
  payoutPerShare?: number;
}

export interface ProtocolArbitrage {
  marketId: string;
  protocol1: { name: string; price: number };
  protocol2: { name: string; price: number };
  profit: number;
  riskLevel: 'low' | 'medium' | 'high';
}
