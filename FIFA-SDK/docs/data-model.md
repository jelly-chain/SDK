# Data Model

All SDK entities use deterministic normalized IDs.

## ID Conventions

| Entity | Format | Example |
|---|---|---|
| Tournament | `fifa-wc-{year}` | `fifa-wc-2026` |
| Group | `wc{yy}-group-{code}` | `wc26-group-b` |
| Fixture | `wc{yy}-match-{nnn}` | `wc26-match-048` |
| Team | `team-{slug}` | `team-argentina` |
| Player | `player-{slug}` | `player-kylian-mbappe` |
| Venue | `venue-{slug}` | `venue-sofi-stadium` |

## Core Types

### Fixture
```ts
interface Fixture {
  id: string;
  tournamentId: string;
  stage: MatchStage;
  groupCode?: GroupCode;
  homeTeamId: string;
  awayTeamId: string;
  venueId: string;
  kickoffUtc: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  homeScore?: number;
  awayScore?: number;
}
```

### Team
```ts
interface Team {
  id: string;
  name: string;
  shortName: string;
  countryCode: string;
  fifaRanking?: number;
  groupCode?: GroupCode;
}
```

### AgentPredictionContext
```ts
type AgentPredictionContext = {
  question: string;
  marketPlatform: "POLYMARKET" | "KALSHI";
  marketType: "MATCH_WINNER" | "GROUP_WINNER" | "QUALIFICATION" | ...;
  entities: { teams: string[]; fixtureId?: string; tournament: string };
  evidence: { standings?: object; form?: object; squadNews?: object[] };
  signals: { favorite?: string; confidence: number; riskFlags: string[]; narrativeTags: string[] };
  explanation: string;
  generatedAt: string;
};
```
