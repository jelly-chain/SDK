# @jellychain/nlp-commands

> Natural language to trading commands parser for the JellyChain ecosystem.

Converts free-text trading instructions into structured, executable commands.

```typescript
import { NlpParser } from '@jellychain/nlp-commands';

const parser = new NlpParser();

const cmd1 = parser.parse('buy 1000 USDC worth of ETH on Ethereum');
// → { intent: 'buy', token: 'ETH', amount: '1000', sourceToken: 'USDC', chain: 'ethereum' }

const cmd2 = parser.parse('sell half my SOL position');
// → { intent: 'sell', token: 'SOL', amount: '50%', position: 'existing' }

const cmd3 = parser.parse('set a stop loss at $1800 for ETH');
// → { intent: 'stop_loss', token: 'ETH', price: '1800' }
```

## License

MIT — JellyChain 🐙
