import { AgentPredictionContext } from '../types.js';
import { ResponseSchema } from '../agents/response-schema.js';

const schema = new ResponseSchema();

export const PredictionContextSchema = {
  validate: (obj: unknown): obj is AgentPredictionContext => schema.validate(obj),

  example(): AgentPredictionContext {
    return {
      question: 'Will Argentina win Group A?',
      marketPlatform: 'POLYMARKET',
      marketType: 'GROUP_WINNER',
      entities: {
        teams: ['team-argentina'],
        tournament: 'fifa-wc-2026',
      },
      evidence: {
        standings: [],
        form: [],
        squadNews: [],
      },
      signals: {
        favorite: 'team-argentina',
        confidence: 0.75,
        riskFlags: [],
        narrativeTags: ['group-decider'],
      },
      explanation: 'Argentina is strong favorites based on form and ranking.',
      generatedAt: new Date().toISOString(),
    };
  },
};
