export interface AgentResponseData {
  tool: string;
  version: string;
  success: boolean;
  data: unknown;
  error?: string;
  generatedAt: string;
}

export const AgentResponseSchema = {
  wrap(tool: string, data: unknown, error?: string): AgentResponseData {
    return {
      tool,
      version: '0.1.0',
      success: !error,
      data,
      error,
      generatedAt: new Date().toISOString(),
    };
  },

  validate(obj: unknown): obj is AgentResponseData {
    if (typeof obj !== 'object' || obj === null) return false;
    const r = obj as Record<string, unknown>;
    return typeof r['tool'] === 'string' && typeof r['success'] === 'boolean';
  },
};
