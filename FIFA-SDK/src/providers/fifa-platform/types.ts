/** Raw response types from the FIFA platform API. */

export interface FifaMatchRaw {
  MatchId: string;
  CompetitionId: string;
  HomeTeam: string;
  AwayTeam: string;
  Venue: string;
  Date: string;
  HomeScore?: number;
  AwayScore?: number;
  Status: string;
}

export interface FifaTeamRaw {
  IdTeam: string;
  Name: string;
  ShortName: string;
  CountryCode: string;
  FifaRanking?: number;
}

export interface FifaStandingRaw {
  IdTeam: string;
  Position: number;
  Played: number;
  Won: number;
  Drawn: number;
  Lost: number;
  GoalsFor: number;
  GoalsAgainst: number;
  GoalDifference: number;
  Points: number;
}
