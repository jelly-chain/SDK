import { Agent } from '../core/agent.js';

export interface AgentModule {
  name: string;
  attach(agent: Agent): void;
  observe?(): Promise<unknown> | unknown;
  execute?(decision: unknown): Promise<unknown>;
  onStart?(): Promise<void>;
  onStop?(): Promise<void>;
}

export class TradingModule implements AgentModule {
  name = 'trading';
  private agent!: Agent;

  attach(agent: Agent): void {
    this.agent = agent;
  }

  async observe(): Promise<unknown> {
    return { type: 'market_data', confidence: 0.7, signal: 'bullish' };
  }

  async execute(decision: any): Promise<unknown> {
    return { executed: true, action: decision.action, amount: '1000' };
  }
}

export class ScanningModule implements AgentModule {
  name = 'scanning';
  private agent!: Agent;

  attach(agent: Agent): void {
    this.agent = agent;
  }

  async observe(): Promise<unknown> {
    return { type: 'scan_result', tokens: [], narrative: null };
  }
}

export class AnalyzingModule implements AgentModule {
  name = 'analyzing';
  private agent!: Agent;

  attach(agent: Agent): void {
    this.agent = agent;
  }

  async observe(): Promise<unknown> {
    return { type: 'analysis', sentiment: 'neutral' };
  }
}

export class ReportingModule implements AgentModule {
  name = 'reporting';
  private agent!: Agent;

  attach(agent: Agent): void {
    this.agent = agent;
  }

  async onStart(): Promise<void> {
    console.log('Reporting module started');
  }
}
