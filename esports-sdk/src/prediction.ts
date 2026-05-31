import type { EsportTeam, EsportMatch, EsportPrediction } from './types.js';

export class EsportPredictor {
  predict(home: EsportTeam, away: EsportTeam, bestOf: number): EsportPrediction {
    let homeScore = 0.5;
    const factors: string[] = [];

    // Rating differential
    const ratingDiff = home.rating - away.rating;
    homeScore += ratingDiff / 1000;
    if (Math.abs(ratingDiff) > 100) {
      factors.push(`Rating advantage: ${ratingDiff > 0 ? home.name : away.name} (+${Math.abs(ratingDiff)})`);
    }

    // Form
    const homeForm = home.recentForm.filter((r) => r === 'W').length / Math.max(1, home.recentForm.length);
    const awayForm = away.recentForm.filter((r) => r === 'W').length / Math.max(1, away.recentForm.length);
    const formDiff = homeForm - awayForm;
    homeScore += formDiff * 0.15;

    // Best of format (longer series = less upset)
    if (bestOf === 5) {
      homeScore = 0.5 + (homeScore - 0.5) * 1.15;
      factors.push('Bo5 format reduces upset potential');
    }

    homeScore = Math.max(0.1, Math.min(0.9, homeScore));

    // Map advantage
    const mapAdvantage = Math.abs(homeScore - 0.5) > 0.1
      ? `${homeScore > 0.5 ? home.name : away.name} has map pool advantage`
      : 'Even map pool';

    return {
      matchId: '',
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeWinProb: Math.round(homeScore * 100) / 100,
      awayWinProb: Math.round((1 - homeScore) * 100) / 100,
      mapAdvantage,
      factors,
      confidence: Math.min(0.8, 0.5 + Math.abs(homeScore - 0.5)),
    };
  }

  formatForPolymarket(match: EsportMatch, home: EsportTeam, away: EsportTeam): {
    title: string;
    description: string;
    outcomes: string[];
  } {
    return {
      title: `${home.name} vs ${away.name}`,
      description: `${match.tournament} — Best of ${match.bestOf}`,
      outcomes: [home.name, away.name],
    };
  }
}
