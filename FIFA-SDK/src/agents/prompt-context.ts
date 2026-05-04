import { AgentPredictionContext } from '../types.js';

/** Builds structured prompt context strings for agent system prompts. */
export class PromptContext {
  /** Build a system prompt section describing the SDK's capabilities. */
  systemPromptSection(): string {
    return `You have access to the World Cup Jelly SDK, which provides real-time FIFA World Cup intelligence.
Available tools: resolve_market_question, get_fixture_context, get_group_table, get_knockout_path, get_team_form, explain_world_cup_prediction.
Always use structured SDK data before forming opinions. Present confidence levels and note any data gaps.`;
  }

  /** Build an in-context evidence string from a prediction context. */
  evidenceSummary(context: AgentPredictionContext): string {
    const lines: string[] = [
      `Question: ${context.question}`,
      `Market Type: ${context.marketType}`,
      `Teams: ${context.entities.teams.join(', ')}`,
      `Confidence: ${(context.signals.confidence * 100).toFixed(0)}%`,
    ];

    if (context.signals.favorite) lines.push(`Model Favorite: ${context.signals.favorite}`);
    if (context.signals.riskFlags.length > 0) lines.push(`Risk Flags: ${context.signals.riskFlags.join(', ')}`);
    if (context.signals.narrativeTags.length > 0) lines.push(`Narrative: ${context.signals.narrativeTags.join(', ')}`);
    lines.push(`Explanation: ${context.explanation}`);

    return lines.join('\n');
  }
}
