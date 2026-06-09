/**
 * World Cup Jelly SDK — Agent Tools
 * 39+ tools for Claude Code / JellyOS function calling.
 */
import type { AgentPredictionContext, MarketPlatform } from '../../types.js';
import type { TeamsModule } from '../../fifa/teams.js';
import type { MatchesModule } from '../../fifa/matches.js';
import type { PlayersModule } from '../../fifa/players.js';
import type { GroupsModule } from '../../fifa/groups.js';
import type { OddsModule } from '../../fifa/odds.js';
import type { PredictionModule } from '../../fifa/prediction/index.js';
import { Logger } from '../../logger.js';

export type ToolName =
  | 'resolve_market_question' | 'get_fixture_context' | 'get_group_table' | 'explain_world_cup_prediction'
  | 'get_team_info' | 'get_team_roster' | 'get_team_form' | 'get_team_matches'
  | 'get_player_info' | 'get_player_stats' | 'get_player_matches'
  | 'get_group_standings' | 'get_all_standings' | 'get_team_standing' | 'get_tiebreak_scenarios'
  | 'get_stadium_info' | 'get_season_stadiums'
  | 'get_match_detail' | 'get_match_events' | 'get_match_lineups' | 'get_match_summary'
  | 'get_match_player_stats' | 'get_match_team_stats'
  | 'get_match_shots' | 'get_match_momentum' | 'get_match_best_players' | 'get_match_avg_positions'
  | 'get_match_odds' | 'get_futures_odds' | 'get_player_props' | 'get_line_movement'
  | 'get_match_prediction' | 'get_group_prediction' | 'get_qualification_path' | 'get_tournament_prediction'
  | 'get_seasons' | 'get_tournaments' | 'get_tournament_bracket' | 'get_tournament_schedule'
  | 'compare_teams' | 'search_teams' | 'search_players' | 'get_live_matches';

export interface ToolDefinition { name: ToolName; description: string; input_schema: { type: 'object'; properties: Record<string, any>; required?: string[] } }
export interface ToolCall { name: ToolName; parameters: Record<string, unknown> }
export interface ToolResult { tool: ToolName; success: boolean; data: unknown; error?: string }

export class ToolAdapter {
  constructor(
    private readonly teams: TeamsModule, private readonly matches: MatchesModule,
    private readonly players: PlayersModule, private readonly groups: GroupsModule,
    private readonly odds: OddsModule, private readonly prediction: PredictionModule,
  ) {}

  async execute(call: ToolCall): Promise<ToolResult> {
    try {
      let data: unknown;
      const p = call.parameters;
      switch (call.name) {
        case 'resolve_market_question': data = await this.prediction.buildContext(String(p['question']), (p['platform'] as MarketPlatform) ?? 'POLYMARKET'); break;
        case 'get_fixture_context': data = await this.matches.byId(String(p['fixtureId'])); break;
        case 'get_group_table': data = await this.groups.standings(String(p['groupCode']) as any, p['season'] as any); break;
        case 'explain_world_cup_prediction': data = await this.prediction.buildContext(String(p['question']), 'POLYMARKET'); break;
        case 'get_team_info': data = await this.teams.byId(String(p['teamId'])); break;
        case 'get_team_roster': data = await this.teams.roster(String(p['teamId']), p['season'] as any); break;
        case 'get_team_form': data = await this.teams.form(String(p['teamId']), Number(p['window']) || 5); break;
        case 'get_team_matches': data = await this.teams.matches(String(p['teamId']), p['season'] as any); break;
        case 'get_player_info': data = await this.players.byId(String(p['playerId'])); break;
        case 'get_player_stats': data = await this.players.stats(String(p['playerId']), p['season'] as any); break;
        case 'get_player_matches': data = await this.players.matchStats(String(p['playerId']), p['season'] as any); break;
        case 'get_group_standings': data = await this.groups.standings(String(p['groupCode']) as any, p['season'] as any); break;
        case 'get_all_standings': data = await this.groups.allStandings(p['season'] as any); break;
        case 'get_team_standing': data = await this.groups.forTeam(String(p['teamId']), p['season'] as any); break;
        case 'get_tiebreak_scenarios': data = await this.groups.tiebreaks(p['season'] as any); break;
        case 'get_stadium_info': data = { note: 'Use VenuesModule.byId()' }; break;
        case 'get_season_stadiums': data = { note: 'Use VenuesModule.bySeason()' }; break;
        case 'get_match_detail': data = await this.matches.byId(String(p['matchId'])); break;
        case 'get_match_events': data = await this.matches.events(String(p['matchId'])); break;
        case 'get_match_lineups': data = await this.matches.lineups(String(p['matchId']), p['teamId'] as any); break;
        case 'get_match_summary': data = await this.matches.summary(String(p['matchId'])); break;
        case 'get_match_player_stats': data = await this.matches.playerStats(String(p['matchId'])); break;
        case 'get_match_team_stats': data = await this.matches.stats(String(p['matchId'])); break;
        case 'get_match_shots': data = await this.matches.shots(String(p['matchId'])); break;
        case 'get_match_momentum': data = await this.matches.momentum(String(p['matchId'])); break;
        case 'get_match_best_players': data = await this.matches.bestPlayers(String(p['matchId'])); break;
        case 'get_match_avg_positions': data = await this.matches.avgPositions(String(p['matchId'])); break;
        case 'get_match_odds': data = await this.odds.byMatch(String(p['matchId'])); break;
        case 'get_futures_odds': data = await this.odds.futures(p['seasons'] as any); break;
        case 'get_player_props': data = await this.odds.playerProps({ matchId: Number(p['matchId']), playerId: p['playerId'] as any, propType: p['propType'] as any }); break;
        case 'get_line_movement': data = await this.odds.lineMovement(String(p['matchId']), p['vendor'] as any); break;
        case 'get_match_prediction': data = { note: 'Use IntelligenceEngine.predictMatch()' }; break;
        case 'get_group_prediction': data = await this.groups.prediction(String(p['groupCode']) as any, p['season'] as any); break;
        case 'get_qualification_path': data = { note: 'Use GroupsModule.qualificationAnalysis()' }; break;
        case 'get_tournament_prediction': data = { note: 'Use PredictionModule for tournament winner' }; break;
        case 'get_seasons': data = { available: [2018, 2022, 2026] }; break;
        case 'get_tournaments': data = { note: 'Use JellyApiClient.getTournaments()' }; break;
        case 'get_tournament_bracket': data = { note: 'Use JellyApiClient.getTournamentBracket()' }; break;
        case 'get_tournament_schedule': data = { note: 'Use JellyApiClient.getTournamentSchedule()' }; break;
        case 'compare_teams': data = await this.teams.compare(String(p['teamA']), String(p['teamB'])); break;
        case 'search_teams': data = await this.teams.search(String(p['query']), Number(p['limit']) || 10); break;
        case 'search_players': data = await this.players.search(String(p['query']), Number(p['limit']) || 10); break;
        case 'get_live_matches': data = await this.matches.live(); break;
        default: throw new Error(`Unknown tool: ${call.name}`);
      }
      return { tool: call.name, success: true, data };
    } catch (error) {
      return { tool: call.name, success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  getToolDefinitions(): ToolDefinition[] {
    return [
      { name: 'resolve_market_question', description: 'Parse a prediction market question about FIFA World Cup and return structured context with confidence, evidence, and market data', input_schema: { type: 'object', properties: { question: { type: 'string', description: 'The market question to resolve' }, platform: { type: 'string', enum: ['POLYMARKET', 'KALSHI', 'BETFAIR'] } }, required: ['question'] } },
      { name: 'get_team_info', description: 'Full team profile including federation, ranking, and group assignment', input_schema: { type: 'object', properties: { teamId: { type: 'string' } }, required: ['teamId'] } },
      { name: 'get_team_roster', description: 'Full tournament squad with cumulative stats for each player', input_schema: { type: 'object', properties: { teamId: { type: 'string' }, season: { type: 'integer' } }, required: ['teamId'] } },
      { name: 'get_team_form', description: 'Recent match results, form rating, and trend analysis', input_schema: { type: 'object', properties: { teamId: { type: 'string' }, window: { type: 'integer' } }, required: ['teamId'] } },
      { name: 'get_team_matches', description: 'Full fixture and result history for a team', input_schema: { type: 'object', properties: { teamId: { type: 'string' }, season: { type: 'integer' } }, required: ['teamId'] } },
      { name: 'get_player_info', description: 'Player biographical profile', input_schema: { type: 'object', properties: { playerId: { type: 'string' } }, required: ['playerId'] } },
      { name: 'get_player_stats', description: 'Cumulative tournament stats for a player', input_schema: { type: 'object', properties: { playerId: { type: 'string' }, season: { type: 'integer' } }, required: ['playerId'] } },
      { name: 'get_group_standings', description: 'Full group table with positions, points, and form', input_schema: { type: 'object', properties: { groupCode: { type: 'string', pattern: '^[A-H]$' }, season: { type: 'integer' } }, required: ['groupCode'] } },
      { name: 'get_all_standings', description: 'Every group table for a season', input_schema: { type: 'object', properties: { season: { type: 'integer' } } } },
      { name: 'get_match_detail', description: 'Full match details: score, managers, formations, referees', input_schema: { type: 'object', properties: { matchId: { type: 'string' } }, required: ['matchId'] } },
      { name: 'get_match_events', description: 'Time-ordered match incidents: goals, cards, substitutions', input_schema: { type: 'object', properties: { matchId: { type: 'string' } }, required: ['matchId'] } },
      { name: 'get_match_lineups', description: 'Match-day squads with starters, substitutes, formations', input_schema: { type: 'object', properties: { matchId: { type: 'string' }, teamId: { type: 'integer' } }, required: ['matchId'] } },
      { name: 'get_match_summary', description: 'Composite match summary: events + lineups + stats + best players', input_schema: { type: 'object', properties: { matchId: { type: 'string' } }, required: ['matchId'] } },
      { name: 'get_match_odds', description: 'All betting lines for a specific match across all vendors', input_schema: { type: 'object', properties: { matchId: { type: 'string' } }, required: ['matchId'] } },
      { name: 'get_futures_odds', description: 'Outright winner, top scorer, group winner futures odds', input_schema: { type: 'object', properties: { seasons: { type: 'string' } } } },
      { name: 'get_player_props', description: 'Player prop betting odds: anytime goal, shots, assists, cards', input_schema: { type: 'object', properties: { matchId: { type: 'integer' }, playerId: { type: 'integer' }, propType: { type: 'string', enum: ['anytime_goal','assists','card','first_goal','goal_or_assist','last_goal','red_card','saves','shots','shots_on_target','tackles'] } }, required: ['matchId'] } },
      { name: 'get_line_movement', description: 'Historical odds snapshots showing line movement', input_schema: { type: 'object', properties: { matchId: { type: 'string' }, vendor: { type: 'string' } }, required: ['matchId'] } },
      { name: 'compare_teams', description: 'Compare two teams: ranking, form, head-to-head', input_schema: { type: 'object', properties: { teamA: { type: 'string' }, teamB: { type: 'string' } }, required: ['teamA', 'teamB'] } },
      { name: 'search_teams', description: 'Search teams by name with fuzzy matching', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer' } }, required: ['query'] } },
      { name: 'search_players', description: 'Search players by name', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer' } }, required: ['query'] } },
      { name: 'get_live_matches', description: 'Currently live matches', input_schema: { type: 'object', properties: {} } },
    ];
  }
}
