/** Raw response types from api-football.com v3. */

export interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    venue: { id: number; name: string; city: string };
    status: { short: string };
  };
  league: { id: number; name: string; round: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

export interface ApiFootballPlayer {
  player: { id: number; name: string; age: number; position: string };
  statistics: Array<{ games: { appearences: number }; goals: { total: number } }>;
}

export interface ApiFootballStanding {
  rank: number;
  team: { id: number; name: string };
  points: number;
  goalsDiff: number;
  group: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}
