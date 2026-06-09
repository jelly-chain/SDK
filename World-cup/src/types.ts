/**
 * World Cup Jelly SDK — Core Types
 * Three layers: Raw API → Normalized Domain → Agent/Market/Prediction
 */

// ════════════════════════════════════════════════════════════════════════════
// LAYER 1: Raw API response types from api.jellychain.fun
// ════════════════════════════════════════════════════════════════════════════

export type SeasonYear = 2018 | 2022 | 2026;
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';
export type TournamentType = 'world_cup' | 'club_world_cup' | 'womens_world_cup';
export type TournamentStatus = 'upcoming' | 'in_progress' | 'completed';
export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';
export type GroupCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type FormResult = 'W' | 'D' | 'L';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type EliminationRisk = 'none' | 'low' | 'medium' | 'high' | 'eliminated';
export type PredictionType = 'match_winner' | 'group_winner' | 'qualification' | 'tournament_winner' | 'top_scorer';
export type ImpactDirection = 'positive' | 'negative' | 'neutral';
export type MarketPlatform = 'POLYMARKET' | 'KALSHI' | 'BETFAIR';
export type VendorId = 'betmgm' | 'betrivers' | 'caesars' | 'draftkings' | 'fanatics' | 'fanduel';
export type PropType =
  | 'anytime_goal' | 'assists' | 'card' | 'first_goal' | 'goal_or_assist'
  | 'last_goal' | 'red_card' | 'saves' | 'shot_each_half'
  | 'shot_on_target_each_half' | 'shots' | 'shots_on_target' | 'tackles';
export type ShotType = 'goal' | 'save' | 'miss' | 'block' | 'post';
export type ShotSituation = 'open_play' | 'set_piece' | 'corner' | 'free_kick' | 'penalty' | 'counter_attack';
export type BodyPart = 'right_foot' | 'left_foot' | 'head' | 'other';
export type IncidentType = 'goal' | 'card' | 'substitution' | 'period' | 'injury_time' | 'penalty_shootout';
export type Period = 'first_half' | 'second_half' | 'extra_first' | 'extra_second' | 'penalties';

export interface CursorPagination {
  next_cursor: number | null;
  prev_cursor: number | null;
  per_page: number;
  total?: number;
}

export interface JellyApiResponse<T> {
  data: T;
  meta?: CursorPagination;
}

export interface JellySeason {
  id: number;
  year: SeasonYear;
  host_countries: string[];
  teams_count: number;
  matches_count: number;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
}

export interface JellyTournament {
  id: number;
  season: JellySeason;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  stages: JellyStage[];
}

export interface JellyStage {
  id: number;
  name: string;
  order: number;
  type: 'group' | 'knockout';
}

export interface JellyTeam {
  id: number;
  name: string;
  abbreviation: string | null;
  country_code: string | null;
  confederation: Confederation | null;
  fifa_ranking: number | null;
  group_code: GroupCode | null;
  season: JellySeason;
  flag_url: string | null;
}

export interface JellyStadium {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  season: JellySeason;
}

export interface JellyGroup {
  id: number;
  name: string;
  season: JellySeason;
  teams: JellyTeam[];
}

export interface JellyStanding {
  id: number;
  season: JellySeason;
  team: JellyTeam;
  group: JellyGroup;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string | null;
}

export interface JellyPlayer {
  id: number;
  name: string;
  short_name: string | null;
  first_name: string | null;
  last_name: string | null;
  position: PlayerPosition | null;
  date_of_birth: string | null;
  country_code: string | null;
  country_name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  jersey_number: string | null;
  foot: 'left' | 'right' | 'both' | null;
  team: JellyTeam | null;
  photo_url: string | null;
}

export interface JellyRosterEntry {
  id: number;
  season: JellySeason;
  team: JellyTeam;
  player: JellyPlayer;
  position: string | null;
  appearances: number;
  starts: number;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  avg_rating: number | null;
}

export interface JellyMatch {
  id: number;
  match_number: number | null;
  datetime: string;
  status: MatchStatus;
  season: JellySeason;
  stage: JellyStage;
  group: JellyGroup | null;
  stadium: JellyStadium | null;
  home_team: JellyTeam | null;
  away_team: JellyTeam | null;
  home_team_source: JellyTeamSource | null;
  away_team_source: JellyTeamSource | null;
  home_score: number | null;
  away_score: number | null;
  home_score_penalties: number | null;
  away_score_penalties: number | null;
  first_half_home_score: number | null;
  first_half_away_score: number | null;
  second_half_home_score: number | null;
  second_half_away_score: number | null;
  extra_time_home_score: number | null;
  extra_time_away_score: number | null;
  has_extra_time: boolean | null;
  has_penalty_shootout: boolean | null;
  round_number: number | null;
  round_name: string | null;
  home_formation: string | null;
  away_formation: string | null;
  referee: JellyReferee | null;
  home_manager: JellyManager | null;
  away_manager: JellyManager | null;
  attendance: number | null;
  weather: JellyWeather | null;
  temperature_celsius: number | null;
  humidity_pct: number | null;
}

export interface JellyTeamSource {
  type: string;
  source_match_id: number | null;
  source_match_number: number | null;
  source_group_id: number | null;
  source_group_name: string | null;
  placeholder: string | null;
  description: string;
}

export interface JellyReferee {
  id: number;
  name: string;
  country_code: string | null;
  country_name: string | null;
  yellow_cards_issued: number | null;
  red_cards_issued: number | null;
}

export interface JellyManager {
  id: number;
  name: string;
  short_name: string | null;
  nationality: string | null;
  date_of_birth: string | null;
}

export interface JellyWeather {
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'hot' | 'humid' | 'windy' | null;
  temperature_celsius: number | null;
  humidity_pct: number | null;
  wind_speed_kmh: number | null;
}

export interface JellyMatchEvent {
  id: number;
  match_id: number;
  incident_type: IncidentType;
  incident_class: string | null;
  time_minute: number | null;
  added_time: number | null;
  period: Period | null;
  is_home: boolean | null;
  player: JellyPlayer | null;
  assist_player: JellyPlayer | null;
  player_in: JellyPlayer | null;
  player_out: JellyPlayer | null;
  home_score: number | null;
  away_score: number | null;
  shootout_sequence: number | null;
  shootout_description: string | null;
  rescinded: boolean | null;
  reason: string | null;
}

export interface JellyLineupEntry {
  match_id: number;
  team_id: number;
  player: JellyPlayer;
  is_starter: boolean;
  is_substitute: boolean;
  shirt_number: number | null;
  position: string | null;
  formation: string | null;
  formation_place: number | null;
}

export interface JellyPlayerMatchStat {
  match_id: number;
  player: JellyPlayer;
  team: JellyTeam;
  is_home: boolean;
  rating: number | null;
  minutes_played: number | null;
  expected_goals: number | null;
  expected_assists: number | null;
  non_penalty_xg: number | null;
  goals: number | null;
  assists: number | null;
  shots: number | null;
  shots_on_target: number | null;
  blocked_shots: number | null;
  passes_total: number | null;
  passes_accurate: number | null;
  pass_accuracy_pct: number | null;
  key_passes: number | null;
  through_balls: number | null;
  long_balls_total: number | null;
  long_balls_accurate: number | null;
  crosses_total: number | null;
  crosses_accurate: number | null;
  dribbles_attempted: number | null;
  dribbles_completed: number | null;
  dribbles_success_pct: number | null;
  tackles: number | null;
  tackles_won: number | null;
  interceptions: number | null;
  clearances: number | null;
  aerial_duels_won: number | null;
  aerial_duels_lost: number | null;
  ground_duels_won: number | null;
  ground_duels_lost: number | null;
  duels_won: number | null;
  duels_lost: number | null;
  fouls_committed: number | null;
  was_fouled: number | null;
  offsides: number | null;
  touches: number | null;
  touches_in_box: number | null;
  possession_lost: number | null;
  ball_recoveries: number | null;
  big_chances_created: number | null;
  big_chances_missed: number | null;
  saves: number | null;
  saves_inside_box: number | null;
  punches: number | null;
  high_claims: number | null;
  goals_conceded: number | null;
  clean_sheet: boolean | null;
  errors_leading_to_shot: number | null;
  errors_leading_to_goal: number | null;
}

export interface JellyTeamMatchStat {
  match_id: number;
  team: JellyTeam;
  is_home: boolean;
  possession_pct: number | null;
  expected_goals: number | null;
  non_penalty_xg: number | null;
  big_chances: number | null;
  big_chances_missed: number | null;
  shots_total: number | null;
  shots_on_target: number | null;
  shots_off_target: number | null;
  shots_blocked: number | null;
  shots_inside_box: number | null;
  shots_outside_box: number | null;
  hit_woodwork: number | null;
  corners: number | null;
  offsides: number | null;
  fouls: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  passes_total: number | null;
  passes_accurate: number | null;
  pass_accuracy_pct: number | null;
  passes_final_third: number | null;
  long_balls_total: number | null;
  long_balls_accurate: number | null;
  crosses_total: number | null;
  crosses_accurate: number | null;
  tackles: number | null;
  interceptions: number | null;
  clearances: number | null;
  saves: number | null;
  saves_inside_box: number | null;
  ground_duels_won: number | null;
  ground_duels_total: number | null;
  aerial_duels_won: number | null;
  aerial_duels_total: number | null;
  dribbles_completed: number | null;
  dribbles_total: number | null;
  throw_ins: number | null;
  goal_kicks: number | null;
  free_kicks: number | null;
  goals_conceded: number | null;
  clean_sheet: boolean | null;
}

export interface JellyShotEntry {
  id: number;
  match_id: number;
  player: JellyPlayer;
  team: JellyTeam;
  is_home: boolean;
  shot_type: ShotType;
  situation: ShotSituation | null;
  body_part: BodyPart | null;
  goal_type: string | null;
  xg: number | null;
  xgot: number | null;
  player_x: number | null;
  player_y: number | null;
  goal_mouth_x: number | null;
  goal_mouth_y: number | null;
  block_x: number | null;
  block_y: number | null;
  time_minute: number;
  added_time: number | null;
  time_seconds: number | null;
}

export interface JellyMomentumPoint {
  match_id: number;
  minute: number;
  value: number;
}

export interface JellyBestPlayerEntry {
  match_id: number;
  player: JellyPlayer;
  team: JellyTeam;
  is_home: boolean;
  side_rank: number;
  is_man_of_match: boolean;
  rating: number | null;
  reason: string | null;
}

export interface JellyAvgPosition {
  match_id: number;
  player: JellyPlayer;
  team: JellyTeam;
  is_home: boolean;
  avg_x: number;
  avg_y: number;
}

export interface JellyTeamFormEntry {
  match_id: number;
  team: JellyTeam;
  is_home: boolean;
  avg_rating: number | null;
  position: number | null;
  form_string: string | null;
}

export interface JellyBettingOdd {
  id: number;
  match_id: number;
  vendor: VendorId;
  moneyline_home_odds: number | null;
  moneyline_away_odds: number | null;
  moneyline_draw_odds: number | null;
  spread_home_value: string | null;
  spread_home_odds: number | null;
  spread_away_value: string | null;
  spread_away_odds: number | null;
  total_value: string | null;
  total_over_odds: number | null;
  total_under_odds: number | null;
  markets: JellyBettingMarket[];
  updated_at: string;
}

export interface JellyBettingMarket {
  id: number;
  key: string;
  name: string;
  type: string;
  period: string;
  scope: string;
  team_side: 'home' | 'away' | null;
  line_value: string | null;
  updated_at: string;
  outcomes: JellyMarketOutcome[];
}

export interface JellyMarketOutcome {
  id: number;
  key: string;
  name: string;
  type: string;
  side: 'home' | 'away' | null;
  line_value: string | null;
  handicap: string | null;
  american_odds: number | null;
  decimal_odds: number | null;
  implied_probability: number | null;
  updated_at: string;
}

export interface JellyFuturesOdd {
  id: number;
  market_type: string;
  market_name: string;
  team: JellyTeam;
  vendor: VendorId;
  american_odds: number | null;
  decimal_odds: number | null;
  implied_probability: number | null;
  updated_at: string | null;
}

export interface JellyPlayerProp {
  id: number;
  match_id: number;
  player: JellyPlayer;
  vendor: VendorId;
  prop_type: PropType;
  line_value: string;
  market_type: 'milestone' | 'over_under';
  odds: number | null;
  over_odds: number | null;
  under_odds: number | null;
  updated_at: string;
}

export interface JellyLineMovementPoint {
  timestamp: string;
  vendor: VendorId;
  moneyline_home: number | null;
  moneyline_away: number | null;
  moneyline_draw: number | null;
  spread_home: string | null;
  spread_away: string | null;
  total: string | null;
}

export interface JellyVendor {
  id: VendorId;
  name: string;
  display_name: string;
  active: boolean;
  website: string | null;
}

export interface JellyPrediction {
  id: string;
  match_id: number | null;
  group_code: GroupCode | null;
  tournament_id: number | null;
  type: PredictionType;
  home_win_probability: number | null;
  draw_probability: number | null;
  away_win_probability: number | null;
  predicted_winner: string | null;
  confidence: number;
  factors: JellyPredictionFactor[];
  risk_flags: string[];
  narrative_tags: string[];
  generated_at: string;
}

export interface JellyPredictionFactor {
  name: string;
  impact: ImpactDirection;
  weight: number;
  description: string;
}

export interface JellyQualificationPath {
  team: JellyTeam;
  group: JellyGroup;
  current_position: number;
  points: number;
  matches_remaining: number;
  scenarios: JellyQualificationScenario[];
  elimination_risk: EliminationRisk;
}

export interface JellyQualificationScenario {
  description: string;
  conditions: string[];
  probability: number;
  outcome: string;
}

export interface JellyCompositeMatchSummary {
  match: JellyMatch;
  events: JellyMatchEvent[];
  home_lineup: JellyLineupEntry[];
  away_lineup: JellyLineupEntry[];
  home_stats: JellyTeamMatchStat | null;
  away_stats: JellyTeamMatchStat | null;
  best_players: JellyBestPlayerEntry[];
  man_of_the_match: JellyBestPlayerEntry | null;
  shots: JellyShotEntry[];
  momentum: JellyMomentumPoint[];
  prediction: JellyPrediction | null;
  odds: JellyBettingOdd[];
}
