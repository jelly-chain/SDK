# Polymarket CLOB SDK — Agent Skill

Deep Polymarket CLOB integration — full orderbook depth, trade history, and arbitrage detection.

## When to Use

- Need orderbook depth for a Polymarket market
- Detecting arbitrage between Polymarket and other platforms
- Analyzing trade history and volume
- Checking liquidity and spread for position sizing

## Tools

### polymarket_search_markets
Search Polymarket by keyword. Returns markets with prices.

### polymarket_get_orderbook
Get full orderbook depth (bids + asks) for a market token.

### polymarket_get_trades
Get recent trade history for a market.

### polymarket_detect_arbitrage
Compare Polymarket price to external platform to find arb opportunities.

## Required Keys

```bash
POLYMARKET_API_KEY=
POLYMARKET_SECRET=
POLYMARKET_PASSPHRASE=
```
