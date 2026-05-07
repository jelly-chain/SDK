import { Ids } from '../utils/ids.js';

function newEvidenceId(): string {
  return `evid-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

export interface EvidenceItem {
  id: string;
  source: string;
  type: 'odds' | 'standings' | 'injuries' | 'form' | 'news' | 'market' | 'other';
  payload: unknown;
  capturedAt: string;
}

export interface ResearchSessionState {
  sessionId: string;
  createdAt: string;
  question: string;
  sport?: string;
  league?: string;
  marketPlatform?: string;
  status: 'active' | 'finalized';
  evidence: EvidenceItem[];
  findings: {
    highlights: string[];
    concerns: string[];
    synthesizedAt?: string;
  };
}

export interface StartResearchSessionInput {
  question: string;
  sport?: string;
  league?: string;
  marketPlatform?: string;
}

/** Research session state management (in-memory for now). */
export class ResearchSessionManager {
  private readonly sessions = new Map<string, ResearchSessionState>();

  start(input: StartResearchSessionInput): ResearchSessionState {
    const sessionId = `rs-${Ids.league('session')}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const state: ResearchSessionState = {
      sessionId,
      createdAt: new Date().toISOString(),
      question: input.question,
      sport: input.sport,
      league: input.league,
      marketPlatform: input.marketPlatform,
      status: 'active',
      evidence: [],
      findings: { highlights: [], concerns: [] },
    };
    this.sessions.set(sessionId, state);
    return state;
  }

  get(sessionId: string): ResearchSessionState {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Research session not found: ${sessionId}`);
    return s;
  }

  addEvidence(input: {
    sessionId: string;
    evidence: Omit<EvidenceItem, 'id' | 'capturedAt'>;
  }): ResearchSessionState {
    const s = this.get(input.sessionId);
    if (s.status !== 'active') throw new Error('Cannot add evidence to a finalized research session');

    const item: EvidenceItem = {
      id: newEvidenceId(),
      capturedAt: new Date().toISOString(),
      ...input.evidence,
    };

    s.evidence.push(item);
    return s;
  }

  gatherEvidenceSummary(sessionId: string): {
    evidenceCount: number;
    byType: Record<string, number>;
    latestAt: string;
  } {
    const s = this.get(sessionId);
    const byType: Record<string, number> = {};
    for (const e of s.evidence) {
      byType[e.type] = (byType[e.type] ?? 0) + 1;
    }

    return {
      evidenceCount: s.evidence.length,
      byType,
      latestAt: s.evidence.length > 0 ? s.evidence[s.evidence.length - 1].capturedAt : s.createdAt,
    };
  }

  synthesize(input: {
    sessionId: string;
    highlights: string[];
    concerns: string[];
  }): ResearchSessionState {
    const s = this.get(input.sessionId);
    if (s.status !== 'active') throw new Error('Cannot synthesize an already finalized session');

    s.findings.highlights = input.highlights;
    s.findings.concerns = input.concerns;
    s.findings.synthesizedAt = new Date().toISOString();
    s.status = 'finalized';
    return s;
  }
}
