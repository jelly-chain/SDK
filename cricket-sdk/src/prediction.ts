import type { CricketMatch, CricketTeam, CricketPrediction } from './types.js';

export class CricketPredictor {
  predict(home: CricketTeam, away: CricketTeam, format: string, venue: string): CricketPrediction {
    let homeScore = 0.5;
    const factors: string[] = [];

    // Home advantage
    homeScore += 0.05;
    factors.push('Home advantage');

    // Toss impact (significant in T20)
    const tossImpact = format === 't20' ? 'Toss significant — chasing favored' : 'Toss less impactful';

    // Pitch condition
    const pitchCondition = this.assessPitch(venue, format);

    homeScore = Math.max(0.2, Math.min(0.8, homeScore));

    // Draw probability (mainly in Tests)
    const drawProb = format === 'test' ? 0.15 : 0;

    return {
      matchId: '',
      homeWinProb: Math.round((homeScore * (1 - drawProb)) * 100) / 100,
      awayWinProb: Math.round(((1 - homeScore) * (1 - drawProb)) * 100) / 100,
      drawProb,
      factors,
      tossImpact,
      pitchCondition,
    };
  }

  private assessPitch(venue: string, format: string): string {
    // Simplified pitch assessment
    const lower = venue.toLowerCase();
    if (lower.includes('chennai') || lower.includes('mumbai')) return 'Spin-friendly';
    if (lower.includes('perth') || lower.includes('brisbane')) return 'Pace-friendly';
    if (lower.includes('london') || lower.includes('leeds')) return 'Seam-friendly';
    return 'Balanced';
  }

  calculateNRR(teamId: string, innings: Array<{ teamId: string; runs: number; overs: number }>): number {
    let scored = 0;
    let faced = 0;
    let conceded = 0;
    let bowled = 0;

    for (const inn of innings) {
      if (inn.teamId === teamId) {
        scored += inn.runs;
        faced += inn.overs;
      } else {
        conceded += inn.runs;
        bowled += inn.overs;
      }
    }

    if (faced === 0 || bowled === 0) return 0;
    return Math.round((scored / faced - conceded / bowled) * 100) / 100;
  }
}
