/** Adapts referee responses to normalized SDK types. */
import type { Team, Fixture } from '../../types.js';

export class refereeAdapter {
  normalizeTeam(raw: any): Team {
    return {
      id: `team-${String(raw.name).toLowerCase().replace(/\s+/g, '-')}`,
      name: String(raw.name ?? ''),
      shortName: String(raw.abbreviation ?? raw.code ?? raw.name?.slice(0, 3) ?? ''),
      countryCode: String(raw.country ?? raw.country_code ?? ''),
      confederation: raw.confederation ?? null,
      fifaRanking: raw.fifa_ranking ?? raw.ranking ?? null,
      groupCode: null,
      seasonYear: raw.season ?? 2026,
      flagUrl: raw.flag_url ?? raw.logo ?? null,
    };
  }

  normalizeFixture(raw: any): Fixture {
    return {
      id: String(raw.id ?? ''),
      matchNumber: raw.match_number ?? raw.number ?? null,
      datetime: raw.date ?? raw.datetime ?? raw.kickoff ?? new Date().toISOString(),
      status: raw.status ?? 'scheduled',
      seasonYear: raw.season ?? 2026,
      stageName: raw.stage ?? raw.round ?? '',
      stageOrder: raw.stage_order ?? 0,
      groupCode: raw.group ?? null,
      venueId: String(raw.venue_id ?? raw.venue?.id ?? ''),
      homeTeamId: String(raw.home_team?.id ?? raw.home ?? ''),
      awayTeamId: String(raw.away_team?.id ?? raw.away ?? ''),
      homeScore: raw.home_score ?? null,
      awayScore: raw.away_score ?? null,
      homePenalties: raw.home_penalties ?? null,
      awayPenalties: raw.away_penalties ?? null,
      hasExtraTime: raw.extra_time ?? false,
      hasPenaltyShootout: raw.penalties ?? false,
      roundName: raw.round_name ?? null,
      homeFormation: raw.home_formation ?? null,
      awayFormation: raw.away_formation ?? null,
      refereeName: raw.referee?.name ?? null,
      homeManagerName: raw.home_manager?.name ?? null,
      awayManagerName: raw.away_manager?.name ?? null,
      attendance: raw.attendance ?? null,
    };
  }
}
