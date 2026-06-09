import { ParsedCommand, IntentType, ParserResult, ExtractedEntity } from '../types.js';
import { Extractor } from './extractor.js';

export class NlpParser {
  private extractor = new Extractor();

  // Intent patterns — maps regex to intent type
  private readonly PATTERNS: { pattern: RegExp; intent: IntentType }[] = [
    { pattern: /(?:buy|purchase|get)\s+(.+)/i, intent: 'buy' },
    { pattern: /(?:sell|dump|exit)\s+(.+)/i, intent: 'sell' },
    { pattern: /(?:swap|exchange|convert)\s+(.+)/i, intent: 'swap' },
    { pattern: /(?:track|watch|monitor)\s+(.+)/i, intent: 'track' },
    { pattern: /(?:analyze|research|check)\s+(.+)/i, intent: 'analyze' },
    { pattern: /(?:report|summary|status)/i, intent: 'report' },
    { pattern: /(?:alert|notify)\s+(.+)/i, intent: 'alert' },
    { pattern: /(?:stop\s*loss|stop-loss)/i, intent: 'stop_loss' },
    { pattern: /(?:take\s*profit|take-profit)/i, intent: 'take_profit' },
    { pattern: /(?:limit\s*order|limit)/i, intent: 'limit_order' },
  ];

  /**
   * Parse a natural language command into a structured format.
   */
  parse(input: string): ParserResult {
    const errors: string[] = [];
    const normalized = input.toLowerCase().trim();

    // Extract entities first
    const entities = this.extractor.extract(normalized);

    // Detect intent
    let detectedIntent: IntentType | null = null;
    let matchGroups: string[] = [];

    for (const { pattern, intent } of this.PATTERNS) {
      const match = normalized.match(pattern);
      if (match) {
        detectedIntent = intent;
        matchGroups = match.slice(1);
        break;
      }
    }

    if (!detectedIntent) {
      errors.push('Could not detect intent from input');
      return { success: false, errors };
    }

    // Build command from intent + entities
    const command = this.buildCommand(detectedIntent, matchGroups, entities, input);

    return {
      success: true,
      command,
      errors,
    };
  }

  /**
   * Batch parse multiple commands.
   */
  parseBatch(inputs: string[]): ParserResult[] {
    return inputs.map(input => this.parse(input));
  }

  private buildCommand(
    intent: IntentType,
    groups: string[],
    entities: ExtractedEntity[],
    raw: string
  ): ParsedCommand {
    const token = entities.find(e => e.type === 'token')?.value;
    const amount = entities.find(e => e.type === 'amount')?.value;
    const chain = entities.find(e => e.type === 'chain')?.value;
    const price = entities.find(e => e.type === 'price')?.value;

    return {
      intent,
      token,
      amount,
      chain,
      price,
      timeframe: entities.find(e => e.type === 'timeframe')?.value,
      confidence: this.computeConfidence(entities, intent),
      raw,
      entities,
    };
  }

  private computeConfidence(entities: ExtractedEntity[], _intent: IntentType): number {
    let score = 0.5; // Base confidence
    if (entities.some(e => e.type === 'token')) score += 0.2;
    if (entities.some(e => e.type === 'amount')) score += 0.15;
    if (entities.some(e => e.type === 'chain')) score += 0.1;
    return Math.min(score, 1);
  }
}
