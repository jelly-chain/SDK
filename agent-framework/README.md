# @jellychain/agent-framework

> Plugin-based autonomous agent system for the JellyChain ecosystem.

Provides agent lifecycle management, a decision engine (brain), short/long-term memory, and pluggable modules for trading, scanning, analysis, execution, and reporting.

```typescript
import { Agent, Brain, Memory } from '@jellychain/agent-framework';

const agent = new Agent({
  name: 'alpha-scanner',
  brain: new Brain({ strategy: 'momentum' }),
  memory: new Memory({ maxEntries: 1000 }),
});

agent.addModule('trading', new TradingModule());
agent.addModule('scanning', new ScanningModule());

agent.on('decision', (decision) => console.log('Agent decided:', decision));
await agent.start();
```

## License

MIT — JellyChain 🐙
