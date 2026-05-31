# Betfair Exchange SDK — Agent Skill

World's largest betting exchange — real orderbook data, exchange odds, market depth.

## When to Use

- Getting exchange-implied probabilities (sharper than bookmaker odds)
- Comparing exchange prices to model predictions
- Finding value bets where model disagrees with market
- Analyzing market depth and liquidity

## Tools

### betfair_get_events
Get events by sport type (football=1, tennis=2, basketball=2, etc.)

### betfair_get_markets
Get available markets for an event.

### betfair_get_prices
Get back/lay prices with depth for a market.

## Required Keys

```bash
BETFAIR_APP_KEY=
BETFAIR_SESSION_TOKEN=
```
