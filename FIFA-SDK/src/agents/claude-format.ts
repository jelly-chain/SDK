import { AgentPredictionContext } from '../types.js';

export interface ClaudeToolOutput {
  type: 'tool_result';
  content: string;
  metadata: {
    confidence: number;
    generatedAt: string;
    sdk: string;
    version: string;
  };
}

/** Formats SDK output for direct use in Claude tool call responses. */
export class ClaudeFormat {
  /** Serialize an AgentPredictionContext to a Claude-compatible tool result. */
  formatPredictionContext(context: AgentPredictionContext): ClaudeToolOutput {
    const content = JSON.stringify(
      {
        question: context.question,
        platform: context.marketPlatform,
        marketType: context.marketType,
        teams: context.entities.teams,
        favorite: context.signals.favorite,
        confidence: context.signals.confidence,
        riskFlags: context.signals.riskFlags,
        narrativeTags: context.signals.narrativeTags,
        explanation: context.explanation,
        evidence: context.evidence,
      },
      null,
      2,
    );

    return {
      type: 'tool_result',
      content,
      metadata: {
        confidence: context.signals.confidence,
        generatedAt: context.generatedAt,
        sdk: 'world-cup-jelly-sdk',
        version: '0.1.0',
      },
    };
  }

  /** Format a missing data warning for the agent. */
  missingDataWarning(field: string): string {
    return `[WARNING] Missing data for field: ${field}. Confidence may be reduced.`;
  }

  /** Format a contradiction flag between model and market odds. */
  contradictionFlag(modelProbability: number, marketProbability: number, threshold = 0.15): string | null {
    const diff = Math.abs(modelProbability - marketProbability);
    if (diff < threshold) return null;
    return `[CONTRADICTION] Model probability (${(modelProbability * 100).toFixed(0)}%) diverges from market (${(marketProbability * 100).toFixed(0)}%) by ${(diff * 100).toFixed(0)}pp`;
  }
}
