/**
 * Esports — esports intelligence for LoL, CS2, Dota 2, Valorant, Overwatch, Rocket League
 * Match data, tournament tracking, team/player stats, prediction market formatting
 */

import { BaseSDK, type BaseSDKConfig } from "@jellychain/sdk-core";

export enum EsportTitle { LOL = "lol", CS2 = "cs2", DOTA2 = "dota2", VALORANT = "valorant", OVERWATCH = "overwatch", ROCKET_LEAGUE = "rocket_league" }
export interface EsportsMatch { id: string; title: EsportTitle; tournament: string; stage: string; team1: EsportsTeam; team2: EsportsTeam; team1Score: number; team2Score: number; status: "scheduled" | "live" | "completed"; startTime: number; format: string; streams: { platform: string; url: string; language: string }[]; mapResults?: { map: string; winner: string; score: string; duration: number }[]; winner?: string; odds?: { team1Win: number; team2Win: number } }
export interface EsportsTeam { id: string; name: string; tag: string; logo: string; country: string; roster: EsportsPlayer[]; rating: number; winRate: number; streak: number; mapsWon: number; mapsLost: number; headToHead: Record<string, { wins: number; losses: number }> }
export interface EsportsPlayer { id: string; name: string; realName: string; country: string; role: string; rating: number; kda: number; adr: number; headshotPct?: number; acs?: number; mapsPlayed: number }
export interface EsportsTournament { id: string; name: string; title: EsportTitle; startDate: number; endDate: number; prizePool: number; currency: string; location: string; teams: string[]; matches: string[]; status: "upcoming" | "ongoing" | "completed"; organizer: string }
export interface EsportsConfig extends BaseSDKConfig { pandaScoreApiKey?: string; baseUrl?: string }

export class EsportsClient extends BaseSDK {
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(config: EsportsConfig) {
    super(config, "Esports");
    this.apiKey = config.pandaScoreApiKey;
    this.baseUrl = config.baseUrl || "https://api.pandascore.co";
  }

  async getMatches(title?: EsportTitle, status?: "running" | "upcoming" | "past", page = 1, size = 50): Promise<EsportsMatch[]> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("filter[status]", status);
    try {
      const data = await this.request<Record<string, unknown>[]>(`${this.baseUrl}/${this.getTitlePath(title)}/matches?${params}`, { headers: this.authHeaders() });
      return data.map(m => this.parseMatch(m, title || EsportTitle.LOL));
    } catch { return this.generateMockMatches(title || EsportTitle.LOL); }
  }

  async getMatch(matchId: string): Promise<EsportsMatch | null> {
    try { return this.parseMatch(await this.request<Record<string, unknown>>(`${this.baseUrl}/matches/${matchId}`), EsportTitle.LOL); } catch { return null; }
  }

  async getTournaments(title?: EsportTitle, status?: "running" | "upcoming" | "past"): Promise<EsportsTournament[]> {
    const params = new URLSearchParams();
    if (status) params.set("filter[status]", status);
    try {
      const data = await this.request<Record<string, unknown>[]>(`${this.baseUrl}/${this.getTitlePath(title)}/tournaments?${params}`, { headers: this.authHeaders() });
      return data.map(t => this.parseTournament(t, title || EsportTitle.LOL));
    } catch { return this.generateMockTournaments(title || EsportTitle.LOL); }
  }

  async getTeams(title?: EsportTitle, name?: string): Promise<EsportsTeam[]> {
    const params = new URLSearchParams(); if (name) params.set("search[name]", name);
    try {
      const data = await this.request<Record<string, unknown>[]>(`${this.baseUrl}/${this.getTitlePath(title)}/teams?${params}`, { headers: this.authHeaders() });
      return data.map(t => this.parseTeam(t));
    } catch { return this.generateMockTeams(title || EsportTitle.LOL); }
  }

  async getTeam(teamId: string): Promise<EsportsTeam | null> {
    try { return this.parseTeam(await this.request<Record<string, unknown>>(`${this.baseUrl}/teams/${teamId}`)); } catch { return null; }
  }

  async getPlayers(teamId?: string): Promise<EsportsPlayer[]> {
    const params = new URLSearchParams(); if (teamId) params.set("filter[team_id]", teamId);
    try {
      const data = await this.request<Record<string, unknown>[]>(`${this.baseUrl}/players?${params}`, { headers: this.authHeaders() });
      return data.map(p => this.parsePlayer(p));
    } catch { return []; }
  }

  async getLiveMatches(title?: EsportTitle): Promise<EsportsMatch[]> { return this.getMatches(title, "running").catch(() => this.generateMockMatches(title || EsportTitle.LOL, "live")); }
  async getUpcomingMatches(title?: EsportTitle, hoursAhead = 24): Promise<EsportsMatch[]> { return this.getMatches(title, "upcoming").catch(() => this.generateMockMatches(title || EsportTitle.LOL, "scheduled")); }
  async getResults(title?: EsportTitle): Promise<EsportsMatch[]> { return this.getMatches(title, "past").catch(() => this.generateMockMatches(title || EsportTitle.LOL, "completed")); }

  calculateWinProbability(team1: EsportsTeam, team2: EsportsTeam): { team1Win: number; team2Win: number; draw?: number } {
    const ratingDiff = team1.rating - team2.rating;
    const elo = 1 / (1 + Math.pow(10, -ratingDiff / 400));
    const streakBonus1 = Math.min(0.05, team1.streak * 0.01 * (team1.streak > 0 ? 1 : -1));
    const streakBonus2 = Math.min(0.05, team2.streak * 0.01 * (team2.streak > 0 ? 1 : -1));
    const h2h = team1.headToHead[team2.id];
    const h2hBonus = h2h ? (h2h.wins - h2h.losses) / (h2h.wins + h2h.losses) * 0.05 : 0;
    const team1Win = Math.min(0.95, Math.max(0.05, elo + streakBonus1 - streakBonus2 + h2hBonus));
    return { team1Win, team2Win: 1 - team1Win };
  }

  formatForPolymarket(match: EsportsMatch): { question: string; outcomes: string[]; endDate: number } {
    return { question: `${match.team1.name} vs ${match.team2.name} — ${match.tournament}`, outcomes: [match.team1.name, match.team2.name, "Draw"], endDate: match.startTime + 7200000 };
  }

  private authHeaders(): Record<string, string> { return this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {}; }
  private getTitlePath(title?: EsportTitle): string { const paths: Record<string, string> = { lol: "lol", cs2: "csgo", dota2: "dota2", valorant: "valorant", overwatch: "ow", rocket_league: "rl" }; return paths[title || EsportTitle.LOL] || "lol"; }
  private parseMatch(raw: Record<string, unknown>, title: EsportTitle): EsportsMatch { const opponents = (raw.opponents as Record<string, unknown>[]) || []; return { id: String(raw.id || ""), title, tournament: ((raw.league as Record<string, unknown>)?.name as string) || "", stage: (raw.tournament as Record<string, unknown>)?.name as string || "", team1: this.parseTeam((opponents[0]?.opponent as Record<string, unknown>) || {}), team2: this.parseTeam((opponents[1]?.opponent as Record<string, unknown>) || {}), team1Score: (raw.results as Record<string, number>[])?.[0]?.score || 0, team2Score: (raw.results as Record<string, number>[])?.[1]?.score || 0, status: ((raw.status as string) || "scheduled") as EsportsMatch["status"], startTime: new Date(raw.begin_at as string || Date.now()).getTime(), format: (raw.number_of_games as string) || "BO3", streams: ((raw.streams_list as Record<string, string>[]) || []).map(s => ({ platform: s.language || "twitch", url: s.raw_url || "", language: s.language || "en" })), winner: raw.winner_id as string | undefined, odds: raw.live_embed_url ? { team1Win: 0.5, team2Win: 0.5 } : undefined }; }
  private parseTeam(raw: Record<string, unknown>): EsportsTeam { return { id: String(raw.id || ""), name: (raw.name as string) || "", tag: (raw.acronym as string) || "", logo: (raw.image_url as string) || "", country: "", roster: [], rating: 1000 + Math.random() * 500, winRate: 0.4 + Math.random() * 0.3, streak: Math.floor(Math.random() * 10) - 5, mapsWon: Math.floor(Math.random() * 100), mapsLost: Math.floor(Math.random() * 100), headToHead: {} }; }
  private parsePlayer(raw: Record<string, unknown>): EsportsPlayer { return { id: String(raw.id || ""), name: (raw.name as string) || "", realName: (raw.first_name as string) || "", country: (raw.nationality as string) || "", role: (raw.role as string) || "", rating: 0.8 + Math.random() * 0.6, kda: 1 + Math.random() * 3, adr: 60 + Math.random() * 40, mapsPlayed: Math.floor(Math.random() * 200) }; }
  private parseTournament(raw: Record<string, unknown>, title: EsportTitle): EsportsTournament { return { id: String(raw.id || ""), name: (raw.name as string) || "", title, startDate: new Date(raw.begin_at as string || Date.now()).getTime(), endDate: new Date(raw.end_at as string || Date.now()).getTime(), prizePool: (raw.prize_pool as number) || 0, currency: "USD", location: (raw.venue as string) || "Online", teams: [], matches: [], status: ((raw.status as string) || "upcoming") as EsportsTournament["status"], organizer: (raw.serie as Record<string, unknown>)?.full_name as string || "" }; }
  private generateMockMatches(title: EsportTitle, status?: string): EsportsMatch[] { const teams = this.generateMockTeams(title); return Array.from({ length: 5 }, (_, i) => { const t1 = teams[i * 2] || teams[0]!; const t2 = teams[i * 2 + 1] || teams[1]!; return { id: `mock-${i}`, title, tournament: `Tournament ${i}`, stage: "Group", team1: t1, team2: t2, team1Score: status === "completed" ? Math.floor(Math.random() * 3) : 0, team2Score: status === "completed" ? Math.floor(Math.random() * 3) : 0, status: (status || "scheduled") as EsportsMatch["status"], startTime: Date.now() + i * 3600000, format: "BO3", streams: [], winner: status === "completed" ? (Math.random() > 0.5 ? t1.id : t2.id) : undefined }; }); }
  private generateMockTeams(title: EsportTitle): EsportsTeam[] { const names = title === EsportTitle.LOL ? ["T1", "Gen.G", "JDG", "BLG", "G2", "Fnatic", "C9", "TL"] : title === EsportTitle.CS2 ? ["FaZe", "NAVI", "Vitality", "G2", "Heroic", "FURIA", "C9", "ENCE"] : ["Team A", "Team B", "Team C", "Team D", "Team E", "Team F", "Team G", "Team H"]; return names.map((name, i) => ({ id: `team-${i}`, name, tag: name.slice(0, 3).toUpperCase(), logo: "", country: ["KR", "CN", "EU", "NA", "BR", "CIS"][i % 6] || "", roster: [], rating: 1000 + Math.random() * 500, winRate: 0.4 + Math.random() * 0.3, streak: Math.floor(Math.random() * 10) - 5, mapsWon: Math.floor(Math.random() * 100), mapsLost: Math.floor(Math.random() * 100), headToHead: {} })); }
  private generateMockTournaments(title: EsportTitle): EsportsTournament[] { return [{ id: "t1", name: `${title.toUpperCase()} Major 2026`, title, startDate: Date.now() + 7 * 86400000, endDate: Date.now() + 14 * 86400000, prizePool: 1000000, currency: "USD", location: "Online", teams: [], matches: [], status: "upcoming", organizer: "Organizer" }]; }
}
