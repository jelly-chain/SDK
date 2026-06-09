export type IntentType = 'buy' | 'sell' | 'swap' | 'track' | 'analyze' | 'report' | 'alert' | 'stop_loss' | 'take_profit' | 'limit_order';

export interface ParsedCommand {
  intent: IntentType;
  token?: string;
  tokenAddress?: string;
  amount?: string;
  sourceToken?: string;
  targetToken?: string;
  chain?: string;
  price?: string;
  stopPrice?: string;
  timeframe?: string;
  confidence: number;
  raw: string;
  entities: ExtractedEntity[];
}

export interface ExtractedEntity {
  type: 'token' | 'amount' | 'chain' | 'price' | 'timeframe' | 'address' | 'action';
  value: string;
  position: [number, number];
}

export interface ParserResult {
  success: boolean;
  command?: ParsedCommand;
  errors: string[];
}
