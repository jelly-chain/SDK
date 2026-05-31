/**
 * Sportradar SDK Types
 */

export interface SportradarConfig {
  apiKey: string;
  version?: 'v7' | 'v8';
  language?: string;
  format?: 'json' | 'xml';
  enabled?: boolean;
}

export interface SportradarSport {
  id: string;
  name: string;
  slug: string;
  categories: SportradarCategory[];
}

export interface SportradarCategory {
  id: string;
  name: string;
  country_code: string;
  sport_id: string;
}

export interface SportradarTournament {
  id: string;
  name: string;
  sport_id: string;
  category_id: string;
  season: SportradarSeason;
  status: string;
}

export interface SportradarSeason {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  year: string;
  tournament_id: string;
}

export interface SportradarCompetitor {
  id: string;
  name: string;
  short_name: string;
  country: string;
  country_code: string;
  abbreviation: string;
  qualifier?: string;
  gender: string;
}

export interface SportradarPlayer {
  id: string;
  name: string;
  full_name: string;
  nationality: string;
  country_code: string;
  date_of_birth: string;
  gender: string;
  height?: number;
  weight?: number;
  jersey_number?: string;
  position?: string;
}

export interface SportradarVenue {
  id: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  capacity?: number;
  coordinates?: { latitude: number; longitude: number };
}

export interface SportradarMatch {
  id: string;
  sport_id: string;
  tournament_id: string;
  season_id: string;
  stage: string;
  status: string;
  scheduled: string;
  actual_start?: string;
  actual_end?: string;
  home: SportradarCompetitor;
  away: SportradarCompetitor;
  home_score?: number;
  away_score?: number;
  period_scores?: Array<{ home: number; away: number; type: string }>;
  venue?: SportradarVenue;
  coverage?: SportradarCoverage;
}

export interface SportradarCoverage {
  live: boolean;
  play_by_play: boolean;
  statistics: boolean;
  lineups: boolean;
  injuries: boolean;
}

export interface SportradarPlayByPlay {
  id: string;
  match_id: string;
  period: number;
  clock: string;
  type: string;
  description: string;
  team_id?: string;
  player_id?: string;
  coordinates?: { x: number; y: number };
  statistics?: Record<string, number>;
}

export interface SportradarStanding {
  tournament_id: string;
  season_id: string;
  groups: SportradarStandingGroup[];
}

export interface SportradarStandingGroup {
  id: string;
  name: string;
  standings: SportradarStandingEntry[];
}

export interface SportradarStandingEntry {
  competitor_id: string;
  competitor_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  position: number;
  form?: string[];
}

export interface SportradarInjury {
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  type: string;
  status: string;
  detail: string;
  start_date: string;
  expected_return?: string;
}

export interface SportradarLineup {
  match_id: string;
  team_id: string;
  formation?: string;
  starters: SportradarLineupPlayer[];
  substitutes: SportradarLineupPlayer[];
  coach: { id: string; name: string };
}

export interface SportradarLineupPlayer {
  player_id: string;
  player_name: string;
  jersey_number: string;
  position: string;
  starter: boolean;
}

export interface SportradarPlayerStatistics {
  player_id: string;
  player_name: string;
  team_id: string;
  match_id: string;
  statistics: Record<string, number>;
}

export interface SportradarMatchStatistics {
  match_id: string;
  home: Record<string, number>;
  away: Record<string, number>;
}
