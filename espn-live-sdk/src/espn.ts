/**
 * EspnLive — free sports data fallback for real-time scores, standings, schedules
 * Covers NFL, NBA, MLB, NHL, MLS, EPL, UCL, and more
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export enum EspnSport { NFL = "nfl", NBA = "nba", MLB = "mlb", NHL = "nhl", MLS = "mls", EPL = "soccer/eng.1", UCL = "soccer/uefa.champions", NCAAF = "football/college-football", NCAAB = "basketball/mens-college-basketball", TENNIS = "tennis", GOLF = "golf", UFC = "mma", F1 = "f1" }
export interface EspnGame { id: string; sport: EspnSport; league: string; homeTeam: EspnTeam; awayTeam: EspnTeam; homeScore: number; awayScore: number; status: "pre" | "in" | "post"; period: number; clock: string; date: number; venue: string; season: number }
export interface EspnTeam { id: string; name: string; abbreviation: string; displayName: string; shortName: string; color: string; logo: string; record: string; rank?: number }
export interface EspnStanding { team: EspnTeam; wins: number; losses: number; ties: number; winPercent: number; gamesBack: number; streak: string; lastTen: string; homeRecord: string; awayRecord: string; pointsFor: number; pointsAgainst: number; differential: number }
export interface EspnSchedule { sport: EspnSport; league: string; season: number; week?: number; games: EspnGame[]; lastUpdated: number }

export class EspnLive extends BaseSDK {
  private readonly baseUrl = "https://site.api.espn.com/apis/site/v2/sports";

  constructor(config?: BaseSDKConfig) { super(config, "EspnLive"); }

  async getScores(sport: EspnSport, date?: string): Promise<EspnGame[]> {
    const dateParam = date ? `&dates=${date.replace(/-/g, "")}` : "";
    const sportPath = this.getSportPath(sport);
    const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${sportPath}/scoreboard${dateParam ? "?" + dateParam.slice(1) : ""}`);
    return this.parseGames(data, sport);
  }

  async getGameDetails(sport: EspnSport, gameId: string): Promise<EspnGame | null> {
    try { const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${this.getSportPath(sport)}/summary?event=${gameId}`); return this.parseGame(data, sport); } catch { return null; }
  }

  async getStandings(sport: EspnSport): Promise<EspnStanding[]> {
    const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${this.getSportPath(sport)}/standings`);
    return this.parseStandings(data);
  }

  async getSchedule(sport: EspnSport, season?: number, week?: number): Promise<EspnSchedule> {
    const params = new URLSearchParams(); if (season) params.set("season", String(season)); if (week) params.set("week", String(week));
    const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${this.getSportPath(sport)}/scoreboard?${params}`);
    return { sport, league: sport, season: season || new Date().getFullYear(), week, games: this.parseGames(data, sport), lastUpdated: Date.now() };
  }

  async getTeam(sport: EspnSport, teamId: string): Promise<EspnTeam | null> {
    try { const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${this.getSportPath(sport)}/teams/${teamId}`); return this.parseTeam(data); } catch { return null; }
  }

  async getTeamSchedule(sport: EspnSport, teamId: string): Promise<EspnGame[]> {
    const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${this.getSportPath(sport)}/teams/${teamId}/schedule`);
    return this.parseGames(data, sport);
  }

  async getTeamRoster(sport: EspnSport, teamId: string): Promise<{ id: string; name: string; position: string; number: number; height: string; weight: string; age: number; experience: number; college: string; headshot: string; status: string }[]> {
    const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${this.getSportPath(sport)}/teams/${teamId}/roster`);
    return this.parseRoster(data);
  }

  async getPlayerStats(sport: EspnSport, playerId: string): Promise<Record<string, number>> {
    const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${this.getSportPath(sport)}/athletes/${playerId}/stats`);
    return (data.splits as Record<string, unknown>)?.categories as Record<string, number> || {};
  }

  async getLiveGames(sport: EspnSport): Promise<EspnGame[]> {
    const games = await this.getScores(sport);
    return games.filter(g => g.status === "in");
  }

  async getUpcomingGames(sport: EspnSport, hoursAhead = 24): Promise<EspnGame[]> {
    const games = await this.getScores(sport);
    const cutoff = Date.now() + hoursAhead * 3600000;
    return games.filter(g => g.status === "pre" && g.date <= cutoff).sort((a, b) => a.date - b.date);
  }

  async getCompletedGames(sport: EspnSport, daysBack = 7): Promise<EspnGame[]> {
    const games = await this.getScores(sport);
    const cutoff = Date.now() - daysBack * 86400000;
    return games.filter(g => g.status === "post" && g.date >= cutoff).sort((a, b) => b.date - a.date);
  }

  async searchTeams(sport: EspnSport, query: string): Promise<EspnTeam[]> {
    const data = await this.request<Record<string, unknown>>(`${this.baseUrl}/${this.getSportPath(sport)}/teams`);
    const teams = ((data.sports?.[0] as Record<string, unknown>)?.leagues?.[0] as Record<string, unknown>)?.teams as Record<string, unknown>[] || [];
    return teams.map(t => this.parseTeam(t)).filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.abbreviation.toLowerCase().includes(query.toLowerCase()));
  }

  private getSportPath(sport: EspnSport): string {
    const paths: Record<string, string> = { nfl: "football/nfl", nba: "basketball/nba", mlb: "baseball/mlb", nhl: "hockey/nhl", mls: "soccer/usa.1", "soccer/eng.1": "soccer/eng.1", "soccer/uefa.champions": "soccer/uefa.champions", "football/college-football": "football/college-football", "basketball/mens-college-basketball": "basketball/mens-college-basketball", tennis: "tennis", golf: "golf", mma: "mma", f1: "f1" };
    return paths[sport] || sport;
  }

  private parseGames(data: Record<string, unknown>, sport: EspnSport): EspnGame[] { return ((data.events as Record<string, unknown>[]) || []).map(e => this.parseGame(e, sport)); }
  private parseGame(raw: Record<string, unknown>, sport: EspnSport): EspnGame { const comp = ((raw.competitions as Record<string, unknown>[])?.[0] as Record<string, unknown>) || {}; const competitors = (comp.competitors as Record<string, unknown>[]) || []; const home = (competitors.find(c => (c.homeAway as string) === "home") || competitors[0] || {}) as Record<string, unknown>; const away = (competitors.find(c => (c.homeAway as string) === "away") || competitors[1] || {}) as Record<string, unknown>; const status = comp.status as Record<string, unknown> || {}; return { id: (raw.id as string) || "", sport, league: sport, homeTeam: this.parseTeam(home.team as Record<string, unknown>), awayTeam: this.parseTeam(away.team as Record<string, unknown>), homeScore: parseInt((home.score as string) || "0"), awayScore: parseInt((away.score as string) || "0"), status: ((status.type as Record<string, string>)?.state || "pre") as EspnGame["status"], period: (status.period as number) || 0, clock: (status.displayClock as string) || "0:00", date: new Date((raw.date as string) || Date.now()).getTime(), venue: ((comp.venue as Record<string, unknown>)?.fullName as string) || "", season: (raw.season as number) || new Date().getFullYear() }; }
  private parseTeam(raw: Record<string, unknown>): EspnTeam { return { id: (raw.id as string) || "", name: (raw.name as string) || (raw.shortName as string) || "", abbreviation: (raw.abbreviation as string) || "", displayName: (raw.displayName as string) || "", shortName: (raw.shortDisplayName as string) || "", color: (raw.color as string) || "000000", logo: (raw.logos as Record<string, string>[])?.[0]?.href || "", record: (raw.record as Record<string, unknown>)?.items?.[0]?.summary as string || "0-0" }; }
  private parseStandings(data: Record<string, unknown>): EspnStanding[] { return []; }
  private parseRoster(data: Record<string, unknown>): { id: string; name: string; position: string; number: number; height: string; weight: string; age: number; experience: number; college: string; headshot: string; status: string }[] { return []; }
}
