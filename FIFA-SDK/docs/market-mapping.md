# Market Mapping

How the SDK maps prediction market questions to World Cup entities and resolution criteria.

## Supported Market Types

| Market Type | Resolution |
|---|---|
| `MATCH_WINNER` | Team wins the match (not draw) |
| `GROUP_WINNER` | Team finishes 1st in their group |
| `QUALIFICATION` | Team finishes top 2 in group |
| `REACH_R16` | Team reaches Round of 16 |
| `REACH_QF` | Team reaches Quarterfinal |
| `REACH_SF` | Team reaches Semifinal |
| `REACH_FINAL` | Team reaches the Final |
| `TOURNAMENT_WINNER` | Team wins FIFA World Cup 2026 |
| `TOP_SCORER` | Player wins Golden Boot |

## Parsing a Market Question

```ts
const parsed = sdk.prediction.parser.parse(
  'Will England win Group C?'
);
// { marketType: 'GROUP_WINNER', extractedTeams: ['team-england'], extractedGroup: 'wc26-group-c' }
```

## Polymarket Integration

```ts
const market = await sdk.markets.polymarket.find({
  query: 'Will Brazil win the 2026 FIFA World Cup?'
});
const mapped = sdk.markets.common.resolveQuestion(market.question);
```

## Kalshi Integration

```ts
const market = await sdk.markets.kalshi.market('FIFA-WC26-ARG-WIN');
const snapshot = await sdk.markets.kalshi.market('FIFA-WC26-ARG-WIN');
```
