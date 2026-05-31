/**
 * Governance Proposal Impact Scorer
 * DAO votes that affect token price.
 */

export interface GovernanceProposal {
  id: string;
  dao: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'passed' | 'rejected' | 'executed';
  votingStart: string;
  votingEnd: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorum: number;
  quorumReached: boolean;
  proposer: string;
  executionDelay?: number; // days
}

export interface ProposalImpact {
  proposalId: string;
  dao: string;
  category: 'treasury' | 'tokenomics' | 'partnership' | 'upgrade' | 'governance' | 'fee-change' | 'other';
  impactScore: number; // -1 to 1
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  factors: string[];
  priceImpactEstimate: number; // estimated % change
  timeToImpact: 'immediate' | 'days' | 'weeks' | 'months';
  historicalComparison?: {
    similarProposal: string;
    outcome: string;
    priceChange: number;
  };
}

export interface GovernanceSignal {
  dao: string;
  activeProposals: number;
  passedProposals: number;
  rejectedProposals: number;
  avgVoterTurnout: number;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  topProposals: GovernanceProposal[];
  riskFlags: string[];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'treasury': ['treasury', 'fund', 'allocate', 'budget', 'grant', 'spend'],
  'tokenomics': ['tokenomics', 'burn', 'mint', 'supply', 'inflation', 'deflation', 'emission'],
  'partnership': ['partner', 'collaborate', 'integrate', 'alliance'],
  'upgrade': ['upgrade', 'v2', 'v3', 'migrate', 'bridge', 'smart contract'],
  'governance': ['governance', 'voting', 'delegation', 'council', 'multisig'],
  'fee-change': ['fee', 'gas', 'cost', 'pricing', 'revenue'],
};

const IMPACT_MULTIPLIERS: Record<string, number> = {
  'treasury': 0.3,
  'tokenomics': 0.7,
  'partnership': 0.4,
  'upgrade': 0.5,
  'governance': 0.2,
  'fee-change': 0.6,
  'other': 0.1,
};

export class GovernanceScorer {
  private proposals: Map<string, GovernanceProposal[]> = new Map();
  private impacts: Map<string, ProposalImpact> = new Map();

  /** Register a proposal */
  addProposal(proposal: GovernanceProposal): void {
    const existing = this.proposals.get(proposal.dao) ?? [];
    existing.push(proposal);
    this.proposals.set(proposal.dao, existing);
  }

  /** Score a proposal's impact */
  scoreProposal(proposal: GovernanceProposal): ProposalImpact {
    const lower = `${proposal.title} ${proposal.description}`.toLowerCase();

    // Detect category
    let category: ProposalImpact['category'] = 'other';
    let bestScore = 0;
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const score = keywords.filter((k) => lower.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        category = cat as ProposalImpact['category'];
      }
    }

    // Base impact from category
    const baseImpact = IMPACT_MULTIPLIERS[category] ?? 0.1;

    // Adjust based on vote outcome
    let outcomeMultiplier = 1;
    if (proposal.status === 'passed' || proposal.status === 'executed') {
      outcomeMultiplier = 1.2;
    } else if (proposal.status === 'rejected') {
      outcomeMultiplier = -0.8;
    }

    // Adjust based on voting margin
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const margin = totalVotes > 0 ? (proposal.votesFor - proposal.votesAgainst) / totalVotes : 0;
    const marginMultiplier = 1 + Math.abs(margin) * 0.5;

    // Calculate impact
    let impactScore = baseImpact * outcomeMultiplier * marginMultiplier;
    impactScore = Math.max(-1, Math.min(1, impactScore));

    const direction: ProposalImpact['direction'] =
      impactScore > 0.1 ? 'bullish' : impactScore < -0.1 ? 'bearish' : 'neutral';

    // Price impact estimate
    const priceImpactEstimate = impactScore * 5; // ~5% max

    // Confidence
    const confidence = Math.min(0.9,
      0.3 +
      (totalVotes > 1000 ? 0.2 : 0) +
      (proposal.quorumReached ? 0.2 : 0) +
      (bestScore > 0 ? 0.2 : 0)
    );

    // Factors
    const factors: string[] = [];
    if (category === 'tokenomics') factors.push('Tokenomics change — direct price impact');
    if (category === 'fee-change') factors.push('Fee change affects revenue/value accrual');
    if (margin > 0.5) factors.push('Strong consensus — high likelihood of execution');
    if (margin < -0.5) factors.push('Strong opposition — likely rejection');
    if (proposal.quorumReached) factors.push('Quorum reached — proposal will be decided');
    if (proposal.executionDelay && proposal.executionDelay > 7) {
      factors.push(`Execution delay: ${proposal.executionDelay} days — price impact deferred`);
    }

    const impact: ProposalImpact = {
      proposalId: proposal.id,
      dao: proposal.dao,
      category,
      impactScore: Math.round(impactScore * 100) / 100,
      direction,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      priceImpactEstimate: Math.round(priceImpactEstimate * 100) / 100,
      timeToImpact: proposal.executionDelay
        ? proposal.executionDelay > 30 ? 'months' : proposal.executionDelay > 7 ? 'weeks' : 'days'
        : proposal.status === 'executed' ? 'immediate' : 'days',
    };

    this.impacts.set(proposal.id, impact);
    return impact;
  }

  /** Get governance signal for a DAO */
  getSignal(dao: string): GovernanceSignal {
    const proposals = this.proposals.get(dao) ?? [];
    const activeProposals = proposals.filter((p) => p.status === 'active').length;
    const passedProposals = proposals.filter((p) => p.status === 'passed' || p.status === 'executed').length;
    const rejectedProposals = proposals.filter((p) => p.status === 'rejected').length;

    const totalVotes = proposals.reduce((sum, p) => sum + p.votesFor + p.votesAgainst + p.votesAbstain, 0);
    const avgVoterTurnout = proposals.length > 0 ? totalVotes / proposals.length : 0;

    // Overall sentiment from recent proposals
    const recentImpacts = proposals
      .slice(-5)
      .map((p) => this.impacts.get(p.id) ?? this.scoreProposal(p));
    const avgImpact = recentImpacts.reduce((sum, i) => sum + i.impactScore, 0) / Math.max(1, recentImpacts.length);

    const overallSentiment: GovernanceSignal['overallSentiment'] =
      avgImpact > 0.1 ? 'bullish' : avgImpact < -0.1 ? 'bearish' : 'neutral';

    // Risk flags
    const riskFlags: string[] = [];
    if (activeProposals > 3) riskFlags.push('multiple-active-proposals');
    if (rejectedProposals > passedProposals) riskFlags.push('high-rejection-rate');
    if (avgVoterTurnout < 100) riskFlags.push('low-voter-turnout');

    return {
      dao,
      activeProposals,
      passedProposals,
      rejectedProposals,
      avgVoterTurnout: Math.round(avgVoterTurnout),
      overallSentiment,
      topProposals: proposals.slice(0, 5),
      riskFlags,
    };
  }

  /** Get all proposals for a DAO */
  getProposals(dao: string): GovernanceProposal[] {
    return this.proposals.get(dao) ?? [];
  }

  /** Get impact assessment for a proposal */
  getImpact(proposalId: string): ProposalImpact | undefined {
    return this.impacts.get(proposalId);
  }

  /** Scan for impactful proposals across all DAOs */
  scanForImpactfulProposals(minImpact: number = 0.3): ProposalImpact[] {
    const results: ProposalImpact[] = [];
    for (const [dao, proposals] of this.proposals) {
      for (const proposal of proposals) {
        const impact = this.impacts.get(proposal.id) ?? this.scoreProposal(proposal);
        if (Math.abs(impact.impactScore) >= minImpact) {
          results.push(impact);
        }
      }
    }
    return results.sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore));
  }
}
