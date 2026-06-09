import { EventEmitter } from 'events';
import { Brain, BrainConfig, BrainDecision } from './core/brain.js';
import { Memory, MemoryEntry } from './core/memory.js';
import { AgentModule } from './modules/index.js';

export interface AgentConfig {
  name: string;
  brain?: Brain;
  memory?: Memory;
  scanIntervalMs?: number;
}

export interface AgentState {
  status: 'idle' | 'scanning' | 'analyzing' | 'executing' | 'error';
  currentTask?: string;
  lastDecision?: BrainDecision;
  timestamp: number;
}

export class Agent extends EventEmitter {
  readonly name: string;
  private brain: Brain;
  private memory: Memory;
  private modules: Map<string, AgentModule> = new Map();
  private state: AgentState;
  private interval?: ReturnType<typeof setInterval>;

  constructor(config: AgentConfig) {
    super();
    this.name = config.name;
    this.brain = config.brain || new Brain({});
    this.memory = config.memory || new Memory({ maxEntries: 1000 });
    this.state = { status: 'idle', timestamp: Date.now() };
  }

  addModule(name: string, module: AgentModule): void {
    this.modules.set(name, module);
    module.attach(this);
  }

  getModule<T extends AgentModule>(name: string): T | undefined {
    return this.modules.get(name) as T | undefined;
  }

  async start(scanIntervalMs = 10000): Promise<void> {
    this.state.status = 'idle';
    this.emit('started', { agent: this.name });

    for (const [name, mod] of this.modules) {
      if (mod.onStart) await mod.onStart();
    }

    this.interval = setInterval(() => this.tick(), scanIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.interval) clearInterval(this.interval);
    for (const [, mod] of this.modules) {
      if (mod.onStop) await mod.onStop();
    }
    this.state.status = 'idle';
    this.emit('stopped', { agent: this.name });
  }

  async tick(): Promise<void> {
    this.state.status = 'scanning';
    this.emit('tick', { agent: this.name });

    const observations: unknown[] = [];

    // Gather observations from all modules
    for (const [name, mod] of this.modules) {
      if (mod.observe) {
        const obs = await mod.observe();
        if (obs) observations.push(obs);
      }
    }

    if (observations.length === 0) {
      this.state.status = 'idle';
      return;
    }

    // Feed to brain for decision
    this.state.status = 'analyzing';
    const decision = await this.brain.decide(observations, this.memory);

    this.memory.add({
      type: 'decision',
      data: decision,
      timestamp: Date.now(),
    });

    this.state.lastDecision = decision;
    this.emit('decision', decision);

    // Execute decision through relevant module
    if (decision.action !== 'hold') {
      this.state.status = 'executing';
      const executor = this.modules.get(decision.targetModule || 'trading');
      if (executor?.execute) {
        try {
          const result = await executor.execute(decision);
          this.emit('executed', { decision, result });
        } catch (err) {
          this.state.status = 'error';
          this.emit('error', { decision, error: err });
        }
      }
    }

    this.state.status = 'idle';
    this.state.timestamp = Date.now();
  }

  getState(): AgentState {
    return { ...this.state };
  }

  recall(filter: Partial<MemoryEntry>): MemoryEntry[] {
    return this.memory.query(filter);
  }
}

export { Brain, BrainConfig, BrainDecision } from './core/brain.js';
export { Memory, MemoryEntry } from './core/memory.js';
export { AgentModule } from './modules/index.js';
export type { AgentState, AgentConfig } from '../types.js';
