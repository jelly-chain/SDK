import { AgentRuntime } from './agent-runtime.js';

export type ToolName =
  | 'resolve_market_question'
  | 'get_fixture_context'
  | 'get_group_table'
  | 'get_knockout_path'
  | 'get_team_form'
  | 'compare_market_vs_model'
  | 'explain_world_cup_prediction';

export interface ToolCall {
  name: ToolName;
  parameters: Record<string, unknown>;
}

export interface ToolResult {
  tool: ToolName;
  success: boolean;
  data: unknown;
  error?: string;
}

/** Adapts the SDK as Claude/Jelly agent tools so agents can call them by name. */
export class ToolAdapter {
  constructor(private readonly runtime: AgentRuntime) {}

  /** Execute a named tool call and return a structured result. */
  async execute(call: ToolCall): Promise<ToolResult> {
    try {
      let data: unknown;

      switch (call.name) {
        case 'resolve_market_question':
          data = await this.runtime.getPredictionContext({
            question: String(call.parameters['question'] ?? ''),
            platform: (call.parameters['platform'] as any) ?? 'POLYMARKET',
          });
          break;
        case 'get_fixture_context':
          data = await this.runtime.getMatchContext({
            fixtureId: String(call.parameters['fixtureId'] ?? ''),
          });
          break;
        case 'get_group_table':
          data = await this.runtime.getGroupContext({
            groupCode: String(call.parameters['groupCode'] ?? 'A'),
          });
          break;
        case 'explain_world_cup_prediction':
          data = await this.runtime.buildClaudeToolResponse({
            question: String(call.parameters['question'] ?? ''),
            platform: 'POLYMARKET',
          });
          break;
        default:
          throw new Error(`Unknown tool: ${call.name}`);
      }

      return { tool: call.name, success: true, data };
    } catch (error) {
      return {
        tool: call.name,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Return a tool schema for all supported tools (for Claude function calling). */
  getToolDefinitions(): object[] {
    return [
      {
        name: 'resolve_market_question',
        description: 'Parse a prediction market question about FIFA World Cup and return structured context',
        input_schema: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'The market question to resolve' },
            platform: { type: 'string', enum: ['POLYMARKET', 'KALSHI'] },
          },
          required: ['question'],
        },
      },
      {
        name: 'get_fixture_context',
        description: 'Get full match context including form, standings and narrative for a fixture',
        input_schema: {
          type: 'object',
          properties: { fixtureId: { type: 'string' } },
          required: ['fixtureId'],
        },
      },
      {
        name: 'get_group_table',
        description: 'Get current group standings table with team form',
        input_schema: {
          type: 'object',
          properties: { groupCode: { type: 'string', description: 'Group letter A-L' } },
          required: ['groupCode'],
        },
      },
      {
        name: 'explain_world_cup_prediction',
        description: 'Get a full explanation with confidence, factors, and evidence for a World Cup prediction',
        input_schema: {
          type: 'object',
          properties: { question: { type: 'string' } },
          required: ['question'],
        },
      },
    ];
  }
}
