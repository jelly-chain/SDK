/**
 * Tennis Surface Specialization Module
 * Clay vs hard vs grass win rates per player.
 */

export type Surface = 'hard' | 'clay' | 'grass' | 'carpet' | 'indoor-hard';

export interface SurfaceStats {
  playerId: string;
  surface: Surface;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  titles: number;
  finals: number;
  semifinals: number;
  acesPerMatch: number;
  doubleFaultsPerMatch: number;
  firstServePercentage: number;
  firstServeWinPercentage: number;
  secondServeWinPercentage: number;
  breakPointsSaved: number;
  breakPointsConverted: number;
  tiebreakWinRate: number;
  decidingSetWinRate: number;
  recentForm: number[]; // Last 10 results (1=win, 0=loss)
}

export interface SurfaceSpecialist {
  playerId: string;
  playerName: string;
  bestSurface: Surface;
  worstSurface: Surface;
  surfaceDelta: number; // Difference between best and worst win rates
  specializations: {
    clay: { rating: number; level: 'elite' | 'strong' | 'average' | 'weak' };
    hard: { rating: number; level: 'elite' | 'strong' | 'average' | 'weak' };
    grass: { rating: number; level: 'elite' | 'strong' | 'average' | 'weak' };
  };
}

export interface SurfaceMatchup {
  player1Id: string;
  player2Id: string;
  surface: Surface;
  player1SurfaceWinRate: number;
  player2SurfaceWinRate: number;
  surfaceAdvantage: string;
  factors: string[];
  confidence: number;
}

export interface TournamentSurfaceAnalysis {
  tournamentId: string;
  tournamentName: string;
  surface: Surface;
  altitude?: number; // meters
  speed: 'slow' | 'medium' | 'fast';
  topContenders: Array<{
    playerId: string;
    playerName: string;
    surfaceRating: number;
    surfaceWinRate: number;
    titlesAtTournament: number;
  }>;
  surfaceFactors: string[];
}

export class TennisSurfaceModule {
  private playerStats: Map<string, Map<Surface, SurfaceStats>> = new Map();

  /** Register surface stats for a player */
  addSurfaceStats(playerId: string, stats: SurfaceStats): void {
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, new Map());
    }
    this.playerStats.get(playerId)!.set(stats.surface, stats);
  }

  /** Get player stats for a surface */
  getPlayerSurfaceStats(playerId: string, surface: Surface): SurfaceStats | undefined {
    return this.playerStats.get(playerId)?.get(surface);
  }

  /** Get all surface stats for a player */
  getPlayerAllSurfaces(playerId: string): SurfaceStats[] {
    return Array.from(this.playerStats.get(playerId)?.values() ?? []);
  }

  /** Analyze player's surface specialization */
  analyzeSpecialist(playerId: string, playerName: string): SurfaceSpecialist | null {
    const stats = this.playerStats.get(playerId);
    if (!stats || stats.size === 0) return null;

    let bestSurface: Surface = 'hard';
    let worstSurface: Surface = 'hard';
    let bestWinRate = 0;
    let worstWinRate = 1;

    for (const [surface, surfaceStats] of stats) {
      if (surfaceStats.winRate > bestWinRate) {
        bestWinRate = surfaceStats.winRate;
        bestSurface = surface;
      }
      if (surfaceStats.winRate < worstWinRate) {
        worstWinRate = surfaceStats.winRate;
        worstSurface = surface;
      }
    }

    const classify = (winRate: number): 'elite' | 'strong' | 'average' | 'weak' =>
      winRate > 0.75 ? 'elite' : winRate > 0.6 ? 'strong' : winRate > 0.45 ? 'average' : 'weak';

    return {
      playerId,
      playerName,
      bestSurface,
      worstSurface,
      surfaceDelta: bestWinRate - worstWinRate,
      specializations: {
        clay: { rating: stats.get('clay')?.winRate ?? 0.5, level: classify(stats.get('clay')?.winRate ?? 0.5) },
        hard: { rating: stats.get('hard')?.winRate ?? 0.5, level: classify(stats.get('hard')?.winRate ?? 0.5) },
        grass: { rating: stats.get('grass')?.winRate ?? 0.5, level: classify(stats.get('grass')?.winRate ?? 0.5) },
      },
    };
  }

  /** Compare two players on a specific surface */
  compareOnSurface(player1Id: string, player2Id: string, surface: Surface): SurfaceMatchup | null {
    const p1Stats = this.playerStats.get(player1Id)?.get(surface);
    const p2Stats = this.playerStats.get(player2Id)?.get(surface);
    if (!p1Stats || !p2Stats) return null;

    const p1WinRate = p1Stats.winRate;
    const p2WinRate = p2Stats.winRate;
    const diff = p1WinRate - p2WinRate;

    const factors: string[] = [];
    if (Math.abs(diff) > 0.15) {
      factors.push(`Significant ${surface} surface differential (${(Math.abs(diff) * 100).toFixed(1)}%)`);
    }

    // Tiebreak performance
    if (p1Stats.tiebreakWinRate > 0.6 && p2Stats.tiebreakWinRate < 0.4) {
      factors.push('Player 1 excels in tiebreaks');
    }

    // Deciding set performance
    if (p1Stats.decidingSetWinRate > 0.6 && p2Stats.decidingSetWinRate < 0.4) {
      factors.push('Player 1 stronger in deciding sets');
    }

    // Break point conversion
    if (p1Stats.breakPointsConverted > p2Stats.breakPointsConverted + 10) {
      factors.push('Player 1 better at converting break points');
    }

    return {
      player1Id,
      player2Id,
      surface,
      player1SurfaceWinRate: p1WinRate,
      player2SurfaceWinRate: p2WinRate,
      surfaceAdvantage: diff > 0.05 ? player1Id : diff < -0.05 ? player2Id : 'Even',
      factors,
      confidence: Math.min(0.8, 0.5 + Math.abs(diff)),
    };
  }

  /** Analyze tournament surface characteristics */
  analyzeTournamentSurface(
    tournamentId: string,
    tournamentName: string,
    surface: Surface,
    speed: 'slow' | 'medium' | 'fast',
    playerIds: string[],
  ): TournamentSurfaceAnalysis {
    const topContenders = playerIds
      .map((id) => {
        const stats = this.playerStats.get(id)?.get(surface);
        return {
          playerId: id,
          playerName: id, // Would resolve from player database
          surfaceRating: stats?.winRate ?? 0.5,
          surfaceWinRate: stats?.winRate ?? 0.5,
          titlesAtTournament: 0, // Would need historical data
        };
      })
      .sort((a, b) => b.surfaceRating - a.surfaceRating)
      .slice(0, 8);

    const surfaceFactors: string[] = [];
    if (surface === 'clay') {
      surfaceFactors.push('Clay favors baseline rallies and defensive players');
      if (speed === 'slow') surfaceFactors.push('Slow clay — heavy topspin is rewarded');
    } else if (surface === 'grass') {
      surfaceFactors.push('Grass favors serve-and-volley and big servers');
      surfaceFactors.push('Low bounce — aggressive players have edge');
    } else {
      surfaceFactors.push('Hard court — neutral surface, rewards all styles');
      if (speed === 'fast') surfaceFactors.push('Fast hard court — serve is premium');
    }

    return {
      tournamentId,
      tournamentName,
      surface,
      speed,
      topContenders,
      surfaceFactors,
    };
  }

  /** Get surface-specific betting angles */
  getSurfaceBettingAngles(surface: Surface): string[] {
    const angles: string[] = [];

    switch (surface) {
      case 'clay':
        angles.push('Favor clay specialists with high topspin rates');
        angles.push('Long rallies favor endurance — check fitness levels');
        angles.push('Underdogs perform better on clay than other surfaces');
        angles.push('Altitude affects clay courts differently — check venue');
        break;
      case 'grass':
        angles.push('Big servers have significant advantage');
        angles.push('Breaks of serve are more valuable');
        angles.push('Experienced grass players outperform ranking');
        angles.push('First week of Wimbledon is upset-heavy');
        break;
      case 'hard':
        angles.push('Most neutral surface — form and ranking hold better');
        angles.push('Indoor hard courts favor aggressive players');
        angles.push('Check court speed — fast vs slow hard courts matter');
        break;
    }

    return angles;
  }
}
