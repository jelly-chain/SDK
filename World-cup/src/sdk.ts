/**
 * World Cup Jelly SDK — Main SDK Class
 *
 * Orchestrates all modules: providers, domain logic, intelligence, prediction, agents.
 */
import { SDKConfig } from './config.js';
import { Logger } from './logger.js';
import { MemoryCache } from './cache/memory-cache.js';
import { JellyApiClient } from './providers/jelly-api/client.js';
import { JellyApiAdapter } from './providers/jelly-api/adapter.js';
import { TeamsModule } from './fifa/teams.js';
import { MatchesModule } from './fifa/matches.js';
import { PlayersModule } from './fifa/players.js';
import { VenuesModule } from './fifa/venues.js';
import { GroupsModule } from './fifa/groups.js';
import { StandingsModule } from './fifa/standings.js';
import { RostersModule } from './fifa/rosters.js';
import { StatsModule } from './fifa/stats.js';
import { OddsModule } from './fifa/odds.js';
import { IntelligenceEngine } from './fifa/intelligence/index.js';
import { PredictionModule } from './fifa/prediction/index.js';
import { ToolAdapter } from './agents/tools/index.js';
import type { WorldCupSDKConfig } from './types.js';

export interface FifaNamespace {
  teams: TeamsModule;
  matches: MatchesModule;
  players: PlayersModule;
  venues: VenuesModule;
  groups: GroupsModule;
  standings: StandingsModule;
  rosters: RostersModule;
  stats: StatsModule;
  odds: OddsModule;
}

export interface IntelligenceNamespace {
  engine: IntelligenceEngine;
}

export interface PredictionNamespace {
  module: PredictionModule;
}

export class WorldCupJellySDK {
  public readonly fifa: FifaNamespace;
  public readonly intelligence: IntelligenceNamespace;
  public readonly prediction: PredictionNamespace;
  public readonly agents: ToolAdapter;
  public readonly jellyApi: JellyApiClient;
  public readonly jellyAdapter: JellyApiAdapter;

  private readonly config: SDKConfig;
  private readonly logger: Logger;
  private readonly cache: MemoryCache;

  constructor(userConfig: WorldCupSDKConfig = {}) {
    this.config = new SDKConfig(userConfig);
    this.logger = Logger.getInstance(this.config.get('logging'));
    this.cache = new MemoryCache(this.config.get('cache'));
    this.jellyApi = new JellyApiClient(this.config.get('providers').jellyApi);
    this.jellyAdapter = new JellyApiAdapter();

    this.logger.info('WorldCupJellySDK initializing', { version: '1.0.0' });

    this.fifa = {
      teams: new TeamsModule(this.cache, this.jellyApi, this.jellyAdapter),
      matches: new MatchesModule(this.cache, this.jellyApi, this.jellyAdapter),
      players: new PlayersModule(this.cache, this.jellyApi, this.jellyAdapter),
      venues: new VenuesModule(this.cache, this.jellyApi, this.jellyAdapter),
      groups: new GroupsModule(this.cache, this.jellyApi, this.jellyAdapter),
      standings: new StandingsModule(this.cache, this.jellyApi, this.jellyAdapter),
      rosters: new RostersModule(this.cache, this.jellyApi, this.jellyAdapter),
      stats: new StatsModule(this.cache, this.jellyApi, this.jellyAdapter),
      odds: new OddsModule(this.cache, this.jellyApi, this.jellyAdapter),
    };

    this.intelligence = {
      engine: new IntelligenceEngine(this.fifa.teams, this.fifa.matches, this.fifa.groups, this.fifa.odds),
    };

    this.prediction = {
      module: new PredictionModule(this.fifa.teams, this.fifa.matches, this.fifa.groups, this.fifa.odds, this.intelligence.engine),
    };

    this.agents = new ToolAdapter(this.fifa.teams, this.fifa.matches, this.fifa.players, this.fifa.groups, this.fifa.odds, this.prediction.module);

    this.logger.info('WorldCupJellySDK ready');
  }
}
