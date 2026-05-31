/**
 * Claude Agent Tool Definitions for Sportradar SDK
 */

export const SPORTRADAR_TOOLS = [
  {
    name: 'sportradar_get_sports',
    description: 'Get all available sports from Sportradar. Returns list of sports with IDs and categories.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'sportradar_get_live_matches',
    description: 'Get currently live matches for a sport. Returns real-time scores and status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sportId: { type: 'string', description: 'Sport ID (e.g., sr:sport:1 for football)' },
      },
      required: ['sportId'],
    },
  },
  {
    name: 'sportradar_get_schedule',
    description: 'Get scheduled matches for a season. Returns upcoming fixtures with venues and times.',
    input_schema: {
      type: 'object' as const,
      properties: {
        seasonId: { type: 'string', description: 'Season ID (e.g., sr:season:12345)' },
      },
      required: ['seasonId'],
    },
  },
  {
    name: 'sportradar_get_match_summary',
    description: 'Get detailed match summary including scores, statistics, and lineups.',
    input_schema: {
      type: 'object' as const,
      properties: {
        matchId: { type: 'string', description: 'Match ID (e.g., sr:sport_event:12345)' },
      },
      required: ['matchId'],
    },
  },
  {
    name: 'sportradar_get_standings',
    description: 'Get league standings for a season. Returns positions, points, wins, draws, losses.',
    input_schema: {
      type: 'object' as const,
      properties: {
        seasonId: { type: 'string', description: 'Season ID' },
      },
      required: ['seasonId'],
    },
  },
  {
    name: 'sportradar_get_injuries',
    description: 'Get injury reports for a tournament. Returns player injuries with expected return dates.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tournamentId: { type: 'string', description: 'Tournament ID (e.g., sr:tournament:17 for EPL)' },
      },
      required: ['tournamentId'],
    },
  },
  {
    name: 'sportradar_get_play_by_play',
    description: 'Get play-by-play timeline for a match. Returns all events chronologically.',
    input_schema: {
      type: 'object' as const,
      properties: {
        matchId: { type: 'string', description: 'Match ID' },
      },
      required: ['matchId'],
    },
  },
  {
    name: 'sportradar_get_player_stats',
    description: 'Get player statistics for a match. Returns individual player performance data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        matchId: { type: 'string', description: 'Match ID' },
      },
      required: ['matchId'],
    },
  },
];
