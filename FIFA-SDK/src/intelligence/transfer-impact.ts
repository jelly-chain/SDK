/**
 * Transfer Window Impact Module
 * Analyzes how squad changes affect World Cup qualifier odds.
 */

export interface Transfer {
  id: string;
  playerName: string;
  playerId?: string;
  fromTeamId: string;
  toTeamId: string;
  fee?: number; // in millions EUR
  type: 'permanent' | 'loan' | 'free' | 'swap';
  date: string;
  position: string;
  isKeyPlayer: boolean;
}

export interface TransferImpactReport {
  teamId: string;
  window: string; // e.g. "summer-2025" or "winter-2026"
  signings: Transfer[];
  departures: Transfer[];
  netSpend: number;
  qualityDelta: number; // -1 to 1, positive = improved
  keyPlayerLosses: string[];
  keyPlayerAdditions: string[];
  impactFactors: string[];
  oddsImpact: number; // estimated change in win probability
}

export interface TeamTransferSummary {
  teamId: string;
  totalSignings: number;
  totalDepartures: number;
  netSpend: number;
  qualityDelta: number;
  riskFlags: string[];
}

export class TransferImpactEngine {
  private transfers: Transfer[] = [];

  /** Register a transfer */
  addTransfer(transfer: Transfer): void {
    this.transfers.push(transfer);
  }

  /** Register multiple transfers */
  addTransfers(transfers: Transfer[]): void {
    this.transfers.push(...transfers);
  }

  /** Get transfers for a team in a window */
  getTeamTransfers(teamId: string, window?: string): Transfer[] {
    return this.transfers.filter((t) => {
      const matchesTeam = t.fromTeamId === teamId || t.toTeamId === teamId;
      if (!window) return matchesTeam;
      // Window filtering would use date ranges in production
      return matchesTeam;
    });
  }

  /** Analyze transfer impact for a team */
  async analyze(teamId: string, window: string): Promise<TransferImpactReport> {
    const teamTransfers = this.getTeamTransfers(teamId, window);
    const signings = teamTransfers.filter((t) => t.toTeamId === teamId);
    const departures = teamTransfers.filter((t) => t.fromTeamId === teamId);

    const totalIn = signings.reduce((sum, t) => sum + (t.fee ?? 0), 0);
    const totalOut = departures.reduce((sum, t) => sum + (t.fee ?? 0), 0);
    const netSpend = totalIn - totalOut;

    const keyPlayerLosses = departures.filter((t) => t.isKeyPlayer).map((t) => t.playerName);
    const keyPlayerAdditions = signings.filter((t) => t.isKeyPlayer).map((t) => t.playerName);

    // Quality delta calculation
    let qualityDelta = 0;
    const impactFactors: string[] = [];

    // Key player losses hurt more
    for (const loss of departures.filter((t) => t.isKeyPlayer)) {
      qualityDelta -= 0.15;
      impactFactors.push(`lost-key-player: ${loss.playerName} (${loss.position})`);
    }

    // Key player additions help
    for (const addition of signings.filter((t) => t.isKeyPlayer)) {
      qualityDelta += 0.12;
      impactFactors.push(`signed-key-player: ${addition.playerName} (${addition.position})`);
    }

    // High-fee signings indicate quality
    for (const signing of signings.filter((t) => (t.fee ?? 0) > 20)) {
      qualityDelta += 0.05;
      impactFactors.push(`major-signing: ${signing.playerName} (€${signing.fee}M)`);
    }

    // Net spend impact
    if (netSpend > 50) {
      qualityDelta += 0.08;
      impactFactors.push(`heavy-investment: €${netSpend.toFixed(0)}M net spend`);
    } else if (netSpend < -50) {
      qualityDelta -= 0.06;
      impactFactors.push(`player-sales: €${Math.abs(netSpend).toFixed(0)}M net revenue`);
    }

    qualityDelta = Math.max(-1, Math.min(1, qualityDelta));

    // Rough odds impact: 10% quality delta ~= 3% win probability change
    const oddsImpact = qualityDelta * 0.3;

    return {
      teamId,
      window,
      signings,
      departures,
      netSpend,
      qualityDelta,
      keyPlayerLosses,
      keyPlayerAdditions,
      impactFactors,
      oddsImpact,
    };
  }

  /** Get multi-team transfer summary */
  async summarizeTeams(teamIds: string[], window: string): Promise<TeamTransferSummary[]> {
    const summaries: TeamTransferSummary[] = [];
    for (const teamId of teamIds) {
      const report = await this.analyze(teamId, window);
      const riskFlags: string[] = [];
      if (report.keyPlayerLosses.length >= 2) riskFlags.push('major-talent-drain');
      if (report.netSpend < -100) riskFlags.push('selling-club');
      if (report.qualityDelta < -0.2) riskFlags.push('squad-regression');
      if (report.signings.length >= 8) riskFlags.push('high-squad-turnover');
      summaries.push({
        teamId,
        totalSignings: report.signings.length,
        totalDepartures: report.departures.length,
        netSpend: report.netSpend,
        qualityDelta: report.qualityDelta,
        riskFlags,
      });
    }
    return summaries;
  }

  /** Detect teams with destabilizing transfer activity */
  async detectDestabilizedTeams(teamIds: string[], window: string): Promise<string[]> {
    const summaries = await this.summarizeTeams(teamIds, window);
    return summaries
      .filter((s) => s.riskFlags.length >= 2)
      .map((s) => s.teamId);
  }
}
