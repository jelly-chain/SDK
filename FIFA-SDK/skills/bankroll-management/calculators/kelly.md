# Kelly criterion

Compute stake sizing from bankroll and win probability.

## Formula

For a decimal-odds market with payout multiple `b` (profit per 1 unit staked):
- `stake = bankroll * (p*b - q) / b`

Where:
- `p` = probability of winning
- `q = 1 - p`

## Guardrails

- Clamp negative edge to 0 (skip bet) unless you explicitly allow contrarian sizing.
- Apply fractional Kelly (recommended) to reduce volatility.
- Optionally cap stake as a % of bankroll.

## Outputs
- Stake amount
- Edge term `(p*b - q)`
- Kelly fraction and applied caps
