# Sportradar SDK — Agent Skill

This skill enables a Jelly Claude agent to access Tier 1 sports data from Sportradar — real-time scores, play-by-play, player tracking, injury reports across 80+ sports.

## When to Use This Skill

Use this skill when:
- A user asks about live scores, match results, or upcoming fixtures
- The agent needs injury reports or lineup data for prediction analysis
- The agent needs play-by-play data for live event monitoring
- The agent needs standings or league tables
- The agent needs player statistics for prop market analysis

## Supported Sports

| Sport | Sport ID | Coverage |
|-------|----------|----------|
| Football | sr:sport:1 | EPL, La Liga, Bundesliga, Serie A, Ligue 1, UCL, World Cup |
| Basketball | sr:sport:2 | NBA, EuroLeague, national teams |
| Tennis | sr:sport:5 | Grand Slams, ATP, WTA |
| American Football | sr:sport:12 | NFL, NCAAF |
| Baseball | sr:sport:3 | MLB, NPB |
| Ice Hockey | sr:sport:4 | NHL, KHL, SHL |
| MMA | sr:sport:117 | UFC, Bellator |
| Formula 1 | sr:sport:1 | F1 races, qualifying, practice |

## Installation

```bash
cd SDK-main/sportradar-sdk
npm install
```

## Required Environment Variables

```bash
SPORTRADAR_API_KEY=your_api_key_here
```

## Tool Definitions

### sportradar_get_live_matches
Get currently live matches for a sport.
```json
{
  "sportId": "sr:sport:1"
}
```

### sportradar_get_schedule
Get scheduled matches for a season.
```json
{
  "seasonId": "sr:season:12345"
}
```

### sportradar_get_match_summary
Get detailed match summary including scores, statistics, and lineups.
```json
{
  "matchId": "sr:sport_event:12345"
}
```

### sportradar_get_standings
Get league standings for a season.
```json
{
  "seasonId": "sr:season:12345"
}
```

### sportradar_get_injuries
Get injury reports for a tournament.
```json
{
  "tournamentId": "sr:tournament:17"
}
```

## Usage Examples

```typescript
import { SportradarClient, SportradarAdapter } from 'sportradar-jelly-sdk';

const client = new SportradarClient({ apiKey: process.env.SPORTRADAR_API_KEY });
const adapter = new SportradarAdapter();

// Get live football matches
const liveMatches = await client.getLiveMatches('sr:sport:1');
const normalized = adapter.normalizeMatches(liveMatches);

// Get EPL standings
const standings = await client.getStandings('sr:season:12345');
const normalizedStandings = adapter.normalizeStandings(standings!);

// Get injuries for prediction context
const injuries = await client.getInjuries('sr:tournament:17');
const normalizedInjuries = adapter.normalizeInjuries(injuries);
```

## JellyOS Integration

This SDK integrates with:
- **SPORT-SDK** — Provides raw data that SPORT-SDK normalizes
- **FIFA-SDK** — World Cup specific data enrichment
- **weather-venue-sdk** — Venue weather correlation
- **line-movement-sdk** — Odds movement context

## Data Freshness

- Live scores: ~5 second delay
- Play-by-play: ~10 second delay
- Injury reports: Updated hourly
- Standings: Updated after each match
