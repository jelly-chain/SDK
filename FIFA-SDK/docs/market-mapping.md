# Market Mapping

## Question → Market Type

The `MarketQuestionParser` maps natural language questions to `SportMarketType` values:

| Keyword(s) | Market Type |
|---|---|
| win, beat, winner | `MATCH_WINNER` |
| champion, title | `CHAMPIONSHIP_WINNER` |
| series | `SERIES_WINNER` |
| over, under | `OVER_UNDER` |
| spread, handicap | `SPREAD` |
| qualify, advance | `QUALIFICATION` |
| relegated | `RELEGATION` |
| top scorer | `TOP_SCORER` |
| mvp | `MVP` |

## Sport Detection

| Keywords | Detected Sport |
|---|---|
| football, soccer, premier league, la liga, bundesliga, serie a | `football` |
| nba, basketball | `basketball` |
| nfl, super bowl | `american-football` |
| tennis, wimbledon, us open | `tennis` |
| mlb, world series | `baseball` |
| nhl, hockey | `ice-hockey` |
| ufc, mma | `mma` |
| f1, formula 1, grand prix | `formula1` |

## Resolution Criteria

Use `sdk.prediction.resolution.map(marketType, league)` to get a `ResolutionCriteria` object describing what triggers resolution for any market type.
