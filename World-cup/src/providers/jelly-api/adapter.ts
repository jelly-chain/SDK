/**
 * World Cup Jelly SDK — Jelly API Adapter
 *
 * Maps raw api.jellychain.fun response shapes to normalized internal types.
 */

import type {
  Team, Player, Venue, Fixture, GroupStanding, MatchEvent, FormRecord,
  BracketNode, RosterEntry, PlayerMatchStat, TeamMatchStat, ShotEntry,
  MomentumPoint, BestPlayerEntry, AvgPosition, TeamFormEntry,
  BettingOdd, FuturesOdd, PlayerProp, LineMovementPoint, Prediction,
  PredictionFactor, QualificationPath, QualificationScenario,
  LineupEntry, SeasonYear, FormResult,
} from '../../types.js';
import * as J from '../../types.js'; // raw API types

export class JellyApiAdapter {
  normalizeTeam(raw: J.JellyTeam): Team {
    return {
      id: `team-${raw.abbreviation?.toLowerCase() ?? String(raw.id)}`,
      name: raw.name,
      shortName: raw.abbreviation ?? raw.name.slice(0, 3).toUpperCase(),
      countryCode: raw.country_code ?? '',
      confederation: raw.confederation,
      fifaRanking: raw.fifa_ranking,
      groupCode: raw.group_code,
      seasonYear: raw.season.year,
      flagUrl: raw.flag_url,
    };
  }

  normalizePlayer(raw: J.JellyPlayer): Player {
    const nameSlug = raw.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return {
      id: `player-${nameSlug}`,
      name: raw.name,
      shortName: raw.short_name,
      firstName: raw.first_name,
      lastName: raw.last_name,
      position: raw.position,
      dateOfBirth: raw.date_of_birth,
      countryCode: raw.country_code,
      countryName: raw.country_name,
      heightCm: raw.height_cm,
      weightKg: raw.weight_kg,
      jerseyNumber: raw.jersey_number,
      foot: raw.foot,
      teamId: raw.team ? `team-${raw.team.abbreviation?.toLowerCase() ?? String(raw.team.id)}` : null,
      photoUrl: raw.photo_url,
      available: true,
      injuryNote: null,
    };
  }

  normalizeVenue(raw: J.JellyStadium): Venue {
    return {
      id: String(raw.id),
      name: raw.name,
      city: raw.city ?? '',
      country: raw.country ?? '',
      capacity: raw.capacity ?? 0,
      latitude: raw.latitude,
      longitude: raw.longitude,
      imageUrl: raw.image_url,
      seasonYear: raw.season.year,
    };
  }

  normalizeFixture(raw: J.JellyMatch): Fixture {
    return {
      id: `wc${raw.season.year}-match-${raw.id}`,
      matchNumber: raw.match_number,
      datetime: raw.datetime,
      status: raw.status === 'completed' ? 'finished' : raw.status as any,
      seasonYear: raw.season.year,
      stageName: raw.stage?.name ?? '',
      stageOrder: raw.stage?.order ?? 0,
      groupCode: raw.group?.name ?? null,
      venueId: String(raw.stadium?.id ?? ''),
      homeTeamId: raw.home_team ? `team-${raw.home_team.abbreviation?.toLowerCase() ?? String(raw.home_team.id)}` : '',
      awayTeamId: raw.away_team ? `team-${raw.away_team.abbreviation?.toLowerCase() ?? String(raw.away_team.id)}` : '',
      homeScore: raw.home_score,
      awayScore: raw.away_score,
      homePenalties: raw.home_score_penalties,
      awayPenalties: raw.away_score_penalties,
      hasExtraTime: raw.has_extra_time ?? false,
      hasPenaltyShootout: raw.has_penalty_shootout ?? false,
      roundName: raw.round_name,
      homeFormation: raw.home_formation,
      awayFormation: raw.away_formation,
      refereeName: raw.referee?.name ?? null,
      homeManagerName: raw.home_manager?.name ?? null,
      awayManagerName: raw.away_manager?.name ?? null,
      attendance: raw.attendance,
    };
  }

  normalizeGroupStanding(raw: J.JellyStanding): GroupStanding {
    return {
      teamId: `team-${raw.team.abbreviation?.toLowerCase() ?? String(raw.team.id)}`,
      teamName: raw.team.name,
      groupCode: raw.group.name as any,
      position: raw.position,
      played: raw.played,
      won: raw.won,
      drawn: raw.drawn,
      lost: raw.lost,
      goalsFor: raw.goals_for,
      goalsAgainst: raw.goals_against,
      goalDifference: raw.goal_difference,
      points: raw.points,
      form: raw.form,
    };
  }

  normalizeEvent(raw: J.JellyMatchEvent): MatchEvent {
    const playerName = raw.player?.name ?? null;
    const assistName = raw.assist_player?.name ?? null;
    return {
      id: String(raw.id),
      fixtureId: String(raw.match_id),
      type: this.mapIncidentType(raw.incident_type, raw.incident_class),
      minute: raw.time_minute ?? 0,
      addedTime: raw.added_time,
      period: raw.period,
      isHome: raw.is_home ?? true,
      teamId: raw.is_home === true ? 'home' : raw.is_home === false ? 'away' : '',
      playerId: playerName ? playerName.toLowerCase().replace(/\s+/g, '-') : null,
      playerName,
      assistPlayerId: assistName ? assistName.toLowerCase().replace(/\s+/g, '-') : null,
      assistPlayerName: assistName,
      playerInId: raw.player_in?.name?.toLowerCase().replace(/\s+/g, '-') ?? null,
      playerOutId: raw.player_out?.name?.toLowerCase().replace(/\s+/g, '-') ?? null,
      homeScore: raw.home_score,
      awayScore: raw.away_score,
      rescinded: raw.rescinded ?? false,
    };
  }

  normalizeRosterEntry(raw: J.JellyRosterEntry): RosterEntry {
    return {
      playerId: raw.player.name.toLowerCase().replace(/\s+/g, '-'),
      playerName: raw.player.name,
      teamId: raw.team.abbreviation?.toLowerCase() ?? String(raw.team.id),
      teamName: raw.team.name,
      seasonYear: raw.season.year,
      position: raw.position,
      appearances: raw.appearances,
      starts: raw.starts,
      minutesPlayed: raw.minutes_played,
      goals: raw.goals,
      assists: raw.assists,
      yellowCards: raw.yellow_cards,
      redCards: raw.red_cards,
      avgRating: raw.avg_rating,
    };
  }

  normalizePlayerMatchStat(raw: J.JellyPlayerMatchStat): PlayerMatchStat {
    return {
      matchId: String(raw.match_id),
      playerId: raw.player.name.toLowerCase().replace(/\s+/g, '-'),
      playerName: raw.player.name,
      teamId: raw.team.abbreviation?.toLowerCase() ?? String(raw.team.id),
      isHome: raw.is_home,
      rating: raw.rating,
      minutesPlayed: raw.minutes_played,
      expectedGoals: raw.expected_goals,
      expectedAssists: raw.expected_assists,
      goals: raw.goals,
      assists: raw.assists,
      shots: raw.shots,
      shotsOnTarget: raw.shots_on_target,
      passesTotal: raw.passes_total,
      passesAccurate: raw.passes_accurate,
      keyPasses: raw.key_passes,
      tackles: raw.tackles,
      interceptions: raw.interceptions,
      clearances: raw.clearances,
      duelsWon: raw.duels_won,
      foulsCommitted: raw.fouls_committed,
      wasFouled: raw.was_fouled,
      touches: raw.touches,
      possessionLost: raw.possession_lost,
      ballRecoveries: raw.ball_recoveries,
      bigChancesCreated: raw.big_chances_created,
      bigChancesMissed: raw.big_chances_missed,
      saves: raw.saves,
      savesInsideBox: raw.saves_inside_box,
    };
  }

  normalizeShotEntry(raw: J.JellyShotEntry): ShotEntry {
    return {
      id: String(raw.id),
      matchId: String(raw.match_id),
      playerId: raw.player?.name?.toLowerCase().replace(/\s+/g, '-') ?? '',
      playerName: raw.player?.name ?? '',
      teamId: raw.team?.abbreviation?.toLowerCase() ?? String(raw.team?.id ?? ''),
      isHome: raw.is_home,
      shotType: raw.shot_type as any,
      situation: raw.situation as any,
      bodyPart: raw.body_part as any,
      xg: raw.xg,
      xgot: raw.xgot,
      playerX: raw.player_x,
      playerY: raw.player_y,
      goalMouthX: raw.goal_mouth_x,
      goalMouthY: raw.goal_mouth_y,
      timeMinute: raw.time_minute,
      addedTime: raw.added_time,
    };
  }

  normalizeMomentumPoint(raw: J.JellyMomentumPoint): MomentumPoint {
    return { matchId: String(raw.match_id), minute: raw.minute, value: raw.value };
  }

  normalizeBestPlayer(raw: J.JellyBestPlayerEntry): BestPlayerEntry {
    return {
      matchId: String(raw.match_id),
      playerId: raw.player?.name?.toLowerCase().replace(/\s+/g, '-') ?? '',
      playerName: raw.player?.name ?? '',
      teamId: raw.team?.abbreviation?.toLowerCase() ?? String(raw.team?.id ?? ''),
      isHome: raw.is_home,
      sideRank: raw.side_rank,
      isManOfMatch: raw.is_man_of_match,
      rating: raw.rating,
      reason: raw.reason,
    };
  }

  normalizeAvgPosition(raw: J.JellyAvgPosition): AvgPosition {
    return {
      matchId: String(raw.match_id),
      playerId: raw.player?.name?.toLowerCase().replace(/\s+/g, '-') ?? '',
      playerName: raw.player?.name ?? '',
      teamId: raw.team?.abbreviation?.toLowerCase() ?? String(raw.team?.id ?? ''),
      isHome: raw.is_home,
      avgX: raw.avg_x,
      avgY: raw.avg_y,
    };
  }

  normalizeTeamForm(raw: J.JellyTeamFormEntry): TeamFormEntry {
    return {
      matchId: String(raw.match_id),
      teamId: raw.team?.abbreviation?.toLowerCase() ?? String(raw.team?.id ?? ''),
      teamName: raw.team?.name ?? '',
      isHome: raw.is_home,
      avgRating: raw.avg_rating,
      position: raw.position,
      formString: raw.form_string,
    };
  }

  normalizeBettingOdd(raw: J.JellyBettingOdd): BettingOdd {
    return {
      matchId: String(raw.match_id),
      vendor: raw.vendor as any,
      moneylineHome: raw.moneyline_home_odds,
      moneylineAway: raw.moneyline_away_odds,
      moneylineDraw: raw.moneyline_draw_odds,
      spreadHomeValue: raw.spread_home_value,
      spreadHomeOdds: raw.spread_home_odds,
      spreadAwayValue: raw.spread_away_value,
      spreadAwayOdds: raw.spread_away_odds,
      totalValue: raw.total_value,
      totalOverOdds: raw.total_over_odds,
      totalUnderOdds: raw.total_under_odds,
      updatedAt: raw.updated_at,
    };
  }

  normalizeFuturesOdd(raw: J.JellyFuturesOdd): FuturesOdd {
    return {
      marketType: raw.market_type,
      marketName: raw.market_name,
      teamId: raw.team?.abbreviation?.toLowerCase() ?? String(raw.team?.id ?? ''),
      teamName: raw.team?.name ?? '',
      vendor: raw.vendor as any,
      americanOdds: raw.american_odds,
      decimalOdds: raw.decimal_odds,
      impliedProbability: raw.implied_probability,
      updatedAt: raw.updated_at,
    };
  }

  normalizePlayerProp(raw: J.JellyPlayerProp): PlayerProp {
    return {
      matchId: String(raw.match_id),
      playerId: raw.player?.name?.toLowerCase().replace(/\s+/g, '-') ?? '',
      playerName: raw.player?.name ?? '',
      vendor: raw.vendor as any,
      propType: raw.prop_type as any,
      lineValue: raw.line_value,
      marketType: raw.market_type,
      odds: raw.odds,
      overOdds: raw.over_odds,
      underOdds: raw.under_odds,
      updatedAt: raw.updated_at,
    };
  }

  normalizePrediction(raw: J.JellyPrediction): Prediction {
    return {
      id: raw.id,
      matchId: raw.match_id,
      groupCode: raw.group_code,
      tournamentId: raw.tournament_id,
      type: raw.type as any,
      homeWinProbability: raw.home_win_probability,
      drawProbability: raw.draw_probability,
      awayWinProbability: raw.away_win_probability,
      predictedWinner: raw.predicted_winner,
      confidence: raw.confidence,
      factors: raw.factors?.map(f => ({
        name: f.name,
        impact: f.impact as any,
        weight: f.weight,
        description: f.description,
      })) ?? [],
      riskFlags: raw.risk_flags ?? [],
      narrativeTags: raw.narrative_tags ?? [],
      generatedAt: raw.generated_at,
    };
  }

  normalizeQualificationPath(raw: J.JellyQualificationPath): QualificationPath {
    return {
      teamId: raw.team?.abbreviation?.toLowerCase() ?? String(raw.team?.id ?? ''),
      teamName: raw.team?.name ?? '',
      groupCode: raw.group?.name as any ?? 'A',
      currentPosition: raw.current_position,
      points: raw.points,
      matchesRemaining: raw.matches_remaining,
      scenarios: raw.scenarios?.map(s => ({
        description: s.description,
        conditions: s.conditions,
        probability: s.probability,
        outcome: s.outcome,
      })) ?? [],
      eliminationRisk: raw.elimination_risk,
    };
  }

  normalizeLineupEntry(raw: J.JellyLineupEntry): LineupEntry {
    return {
      matchId: String(raw.match_id),
      teamId: String(raw.team_id),
      playerId: raw.player?.name?.toLowerCase().replace(/\s+/g, '-') ?? '',
      playerName: raw.player?.name ?? '',
      isStarter: raw.is_starter,
      isSubstitute: raw.is_substitute,
      shirtNumber: raw.shirt_number,
      position: raw.position,
      formation: raw.formation,
      formationPlace: raw.formation_place,
    };
  }

  buildFormRecord(team: Team, results: FormResult[], goalsScored: number, goalsConceded: number, window = 5): FormRecord {
    const recentResults = results.slice(0, window);
    const formRating = recentResults.length > 0
      ? recentResults.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / (recentResults.length * 3)
      : 0.5;
    const firstHalf = recentResults.slice(0, Math.floor(recentResults.length / 2));
    const secondHalf = recentResults.slice(Math.floor(recentResults.length / 2));
    const firstRating = firstHalf.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / Math.max(firstHalf.length * 3, 1);
    const secondRating = secondHalf.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / Math.max(secondHalf.length * 3, 1);
    const trend = secondRating > firstRating + 0.1 ? 'improving' : secondRating < firstRating - 0.1 ? 'declining' : 'stable';
    return { teamId: team.id, teamName: team.name, window, results: recentResults, goalsScored, goalsConceded, formRating: Math.round(formRating * 100) / 100, trend };
  }

  buildBracketNodes(fixtures: Fixture[], teams: Map<string, Team>): BracketNode[] {
    const nodes: BracketNode[] = [];
    const knockoutStages = ['round-of-16', 'quarterfinal', 'semifinal', 'third-place', 'final'];
    const knockoutFixtures = fixtures.filter(f => knockoutStages.some(s => f.stageName.toLowerCase().includes(s.replace('-', ' ')) || f.stageName.toLowerCase() === s));
    for (const fixture of knockoutFixtures) {
      nodes.push({
        round: fixture.stageName,
        slot: fixture.roundName ?? fixture.id,
        fixtureId: fixture.id,
        homeTeamId: fixture.homeTeamId || null,
        awayTeamId: fixture.awayTeamId || null,
        winnerId: fixture.homeScore != null && fixture.awayScore != null
          ? (fixture.homeScore > fixture.awayScore ? fixture.homeTeamId : fixture.awayScore > fixture.homeScore ? fixture.awayTeamId : fixture.homeScore_penalties != null && fixture.awayScore_penalties != null ? (fixture.homeScore_penalties > fixture.awayScore_penalties ? fixture.homeTeamId : fixture.awayTeamId) : null)
          : null,
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
      });
    }
    return nodes;
  }

  mapOddsToMarkets(rawOdds: J.JellyBettingOdd[]): any[] {
    return rawOdds.map(o => ({
      matchId: String(o.match_id),
      vendor: o.vendor,
      moneyline: { home: o.moneyline_home_odds, away: o.moneyline_away_odds, draw: o.moneyline_draw_odds },
      spread: { home: { value: o.spread_home_value, odds: o.spread_home_odds }, away: { value: o.spread_away_value, odds: o.spread_away_odds } },
      total: { value: o.total_value, over: o.total_over_odds, under: o.total_under_odds },
    }));
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private mapIncidentType(type: string, cls: string | null): MatchEvent['type'] {
    if (type === 'goal') {
      if (cls === 'own_goal') return 'own_goal';
      if (cls === 'penalty') return 'penalty';
      return 'goal';
    }
    if (type === 'card') return (cls?.includes('red') || cls?.includes('second_yellow')) ? 'red_card' : 'yellow_card';
    if (type === 'substitution') return 'substitution';
    if (type === 'penalty_shootout') return 'penalty';
    if (type === 'period') return 'period_marker';
    return 'goal';
  }
}
