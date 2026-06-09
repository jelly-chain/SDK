export type OrderType = 'limit' | 'market' | 'stop-loss' | 'take-profit' | 'oco' | 'trailing-stop' | 'scale';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'open' | 'partial' | 'filled' | 'cancelled' | 'expired' | 'triggered';

export interface Order {
  id: string;
  type: OrderType;
  side: OrderSide;
  token: string;
  symbol: string;
  chain: string;
  amount: string;
  filled: string;
  price?: string;
  stopPrice?: string;
  trailingPercent?: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  parentId?: string; // For OCO linked orders
  scaleLevels?: ScaleLevel[];
}

export interface ScaleLevel {
  price: string;
  amount: string;
  filled: boolean;
}

export interface Position {
  token: string;
  symbol: string;
  chain: string;
  side: 'long' | 'short';
  entryPrice: string;
  amount: string;
  unrealizedPnl: string;
  realizedPnl: string;
  liquidationPrice?: string;
  leverage: number;
}

export interface RiskConfig {
  maxPositionSizeUsd: string;
  maxDrawdownPercent: number;
  maxExposurePerChain: Record<string, string>;
  maxOpenOrders: number;
  dailyLossLimitUsd: string;
}

export interface OrderEngineConfig {
  risk: RiskConfig;
  defaultExpiryMs?: number;
  enableTrailing?: boolean;
}
