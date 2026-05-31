# Data Model

## Core Entity Types

### `Fixture`
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Deterministic fixture ID |
| `sport` | `Sport` | e.g. `'football'`, `'basketball'` |
| `league` | `League` | e.g. `'premier-league'`, `'nba'` |
| `season` | `string` | e.g. `'2025/2026'` |
| `stage` | `MatchStage` | `'regular'`, `'playoff'`, `'final'` |
| `homeTeamId` | `string` | Home team normalized ID |
| `awayTeamId` | `string` | Away team normalized ID |
| `kickoffUtc` | `string` | ISO 8601 UTC kickoff time |
| `status` | `MatchStatus` | `'scheduled'`, `'live'`, `'finished'`, `'postponed'` |
| `homeScore?` | `number` | Home score (when available) |
| `awayScore?` | `number` | Away score (when available) |

### `Team`
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Normalized team ID, e.g. `team-arsenal` |
| `name` | `string` | Full team name |
| `shortName` | `string` | 3-letter abbreviation |
| `sport` | `Sport` | Sport type |
| `league` | `League` | Primary league |
| `countryCode?` | `string` | ISO 3166-1 alpha-3 |
| `ranking?` | `number` | Official ranking (if applicable) |

### `Standing`
| Field | Type | Description |
|---|---|---|
| `teamId` | `string` | Team ID |
| `league` | `League` | League |
| `season` | `string` | Season |
| `position` | `number` | Current position |
| `points` | `number` | Points total |
| `won`, `drawn`, `lost` | `number` | Record |

### `AgentSportsContext`

The primary output type when answering a prediction question. Contains:
- `signals.confidence` — 0–1 probability estimate
- `signals.riskFlags` — array of string risk tags
- `signals.narrativeTags` — array of narrative context tags
- `evidence` — standings, form, injuries
- `explanation` — human-readable reasoning string
