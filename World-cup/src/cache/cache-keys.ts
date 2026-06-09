/**
 * World Cup Jelly SDK — Cache Key Builders
 *
 * Centralized cache key generation to avoid collisions and
 * provide consistent invalidation patterns.
 */

export const CacheKey = {
  // Seasons
  seasons: () => 'fifa:seasons:all',
  season: (year: number) => `fifa:season:${year}`,
  seasonTournaments: (year: number) => `fifa:season:${year}:tournaments`,

  // Teams
  teams: (season?: number) => season ? `fifa:teams:season:${season}` : 'fifa:teams:all',
  team: (id: number | string) => `fifa:team:${id}`,
  teamRoster: (teamId: number | string, season?: number) =>
    season ? `fifa:team:${teamId}:roster:${season}` : `fifa:team:${teamId}:roster`,
  teamForm: (teamId: number | string, window?: number) =>
    window ? `fifa:team:${teamId}:form:${window}` : `fifa:team:${teamId}:form`,
  teamMatches: (teamId: number | string, season?: number) =>
    season ? `fifa:team:${teamId}:matches:${season}` : `fifa:team:${teamId}:matches`,

  // Players
  players: (season?: number, teamId?: number) => {
    let key = 'fifa:players';
    if (season) key += `:s${season}`;
    if (teamId) key += `:t${teamId}`;
    return key;
  },
  player: (id: number | string) => `fifa:player:${id}`,
  playerStats: (id: number | string, season?: number) =>
    season ? `fifa:player:${id}:stats:${season}` : `fifa:player:${id}:stats`,
  playerMatches: (id: number | string, season?: number) =>
    season ? `fifa:player:${id}:matches:${season}` : `fifa:player:${id}:matches`,

  // Groups
  groups: (season?: number) => season ? `fifa:groups:${season}` : 'fifa:groups:all',
  group: (code: string, season?: number) =>
    season ? `fifa:group:${code}:${season}` : `fifa:group:${code}`,
  groupStandings: (code: string, season?: number) =>
    season ? `fifa:group:${code}:standings:${season}` : `fifa:group:${code}:standings`,

  // Standings
  allStandings: (season?: number) => season ? `fifa:standings:all:${season}` : 'fifa:standings:all',
  standingsByGroup: (code: string, season?: number) =>
    season ? `fifa:standings:${code}:${season}` : `fifa:standings:${code}`,
  teamStanding: (teamId: number | string, season?: number) =>
    season ? `fifa:team:${teamId}:standing:${season}` : `fifa:team:${teamId}:standing`,
  tiebreaks: (season?: number) => season ? `fifa:tiebreaks:${season}` : 'fifa:tiebreaks',

  // Matches
  matches: (season?: number, status?: string) => {
    let key = 'fifa:matches';
    if (season) key += `:s${season}`;
    if (status) key += `:${status}`;
    return key;
  },
  match: (id: number | string) => `fifa:match:${id}`,
  matchEvents: (id: number | string) => `fifa:match:${id}:events`,
  matchLineups: (id: number | string) => `fifa:match:${id}:lineups`,
  matchTeamForm: (id: number | string) => `fifa:match:${id}:team-form`,
  matchSummary: (id: number | string) => `fifa:match:${id}:summary`,
  matchPlayerStats: (id: number | string) => `fifa:match:${id}:player-stats`,
  matchTeamStats: (id: number | string) => `fifa:match:${id}:team-stats`,

  // Shots & Momentum
  matchShots: (id: number | string) => `fifa:match:${id}:shots`,
  matchMomentum: (id: number | string) => `fifa:match:${id}:momentum`,
  matchBestPlayers: (id: number | string) => `fifa:match:${id}:best-players`,
  matchAvgPositions: (id: number | string) => `fifa:match:${id}:avg-positions`,

  // Odds
  odds: (season?: number) => season ? `fifa:odds:${season}` : 'fifa:odds:all',
  matchOdds: (id: number | string) => `fifa:match:${id}:odds`,
  futuresOdds: (season?: number) => season ? `fifa:futures:${season}` : 'fifa:futures:all',
  playerProps: (matchId: number | string) => `fifa:match:${matchId}:player-props`,
  vendors: () => 'fifa:odds:vendors',
  lineMovement: (matchId: number | string, vendor?: string) =>
    vendor ? `fifa:match:${matchId}:line-movement:${vendor}` : `fifa:match:${matchId}:line-movement`,

  // Predictions
  matchPrediction: (id: number | string) => `fifa:match:${id}:prediction`,
  groupPrediction: (code: string, season?: number) =>
    season ? `fifa:group:${code}:prediction:${season}` : `fifa:group:${code}:prediction`,
  qualificationPath: (teamId: number | string, season?: number) =>
    season ? `fifa:team:${teamId}:qual-path:${season}` : `fifa:team:${teamId}:qual-path`,
  tournamentPrediction: (id: number | string) => `fifa:tournament:${id}:prediction`,

  // Venues
  stadiums: (season?: number) => season ? `fifa:stadiums:${season}` : 'fifa:stadiums:all',
  stadium: (id: number | string) => `fifa:stadium:${id}`,
  seasonStadiums: (year: number) => `fifa:season:${year}:stadiums`,

  // Tournaments
  tournaments: (season?: number) => season ? `fifa:tournaments:${season}` : 'fifa:tournaments:all',
  tournament: (id: number | string) => `fifa:tournament:${id}`,
  tournamentBracket: (id: number | string) => `fifa:tournament:${id}:bracket`,
  tournamentSchedule: (id: number | string) => `fifa:tournament:${id}:schedule`,

  // Rosters
  rosters: (season?: number) => season ? `fifa:rosters:${season}` : 'fifa:rosters:all',
  seasonRosters: (year: number) => `fifa:seasons:${year}:rosters`,

  // Composite
  playerMatchStats: (playerId: number | string, season?: number) =>
    season ? `fifa:player:${playerId}:match-stats:${season}` : `fifa:player:${playerId}:match-stats`,
  teamMatchStats: (teamId: number | string, season?: number) =>
    season ? `fifa:team:${teamId}:match-stats:${season}` : `fifa:team:${teamId}:match-stats`,

  // Intelligence (SDK-computed, not from cache)
  eloRatings: (teamId: number | string) => `fifa:intel:elo:${teamId}`,
  squadStrength: (teamId: number | string) => `fifa:intel:squad:${teamId}`,
  upsetPotential: (matchId: number | string) => `fifa:intel:upset:${matchId}`,

  /** Build a cache key for an arbitrary query. */
  query: (endpoint: string, params: Record<string, unknown>): string => {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join('&');
    return sorted ? `fifa:query:${endpoint}:${sorted}` : `fifa:query:${endpoint}`;
  },

  /** Get all cache key prefixes for a given domain. */
  invalidationPrefixes: {
    match: (id: number | string) => [
      `fifa:match:${id}`,
      `fifa:match:${id}:odds`,
      `fifa:match:${id}:events`,
      `fifa:match:${id}:lineups`,
      `fifa:match:${id}:shots`,
      `fifa:match:${id}:momentum`,
      `fifa:match:${id}:best-players`,
      `fifa:match:${id}:avg-positions`,
      `fifa:match:${id}:player-stats`,
      `fifa:match:${id}:team-stats`,
      `fifa:match:${id}:summary`,
      `fifa:match:${id}:prediction`,
      `fifa:match:${id}:team-form`,
      `fifa:match:${id}:player-props`,
      `fifa:match:${id}:line-movement`,
    ],
    team: (id: number | string) => [
      `fifa:team:${id}`,
      `fifa:team:${id}:roster`,
      `fifa:team:${id}:form`,
      `fifa:team:${id}:matches`,
      `fifa:team:${id}:standings`,
      `fifa:team:${id}:standing`,
      `fifa:team:${id}:qual-path`,
      `fifa:team:${id}:match-stats`,
    ],
    season: (year: number) => [
      `fifa:season:${year}`,
      `fifa:teams:season:${year}`,
      `fifa:groups:${year}`,
      `fifa:standings:all:${year}`,
      `fifa:odds:${year}`,
      `fifa:futures:${year}`,
      `fifa:stadiums:${year}`,
      `fifa:rosters:${year}`,
    ],
  },
} as const;
