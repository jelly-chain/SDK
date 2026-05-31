# Compliance and Caution

## Data Licensing

- Always respect the terms of service for every data provider you configure.
- The `football-api` provider uses api-football.com — check their licensing for commercial use.
- The `fifa-platform` provider stub assumes you have an appropriate agreement with FIFA for official data.
- Public market data from Polymarket and Kalshi is generally freely accessible for non-commercial research.

## Prediction Disclaimers

- All probability estimates are model-generated and should not be presented as certainty.
- The SDK's confidence scores reflect data availability and signal clarity, not guaranteed accuracy.
- Always include the `modelDisclaimer` from `ExplanationBuilder.build()` when surfacing predictions to end users.

## Market Reading vs Execution

- The SDK is read-only for market data by default.
- Do not use this SDK to automate trades or place orders without additional compliance review.
- Market reading and prediction generation are separated from any execution logic by design.

## Data Separation

- Keep "facts from providers" clearly separated from "model-generated predictions" in all outputs.
- Use the `evidence` field for facts and the `signals` field for model estimates.

## FIFA Branding

- Do not imply official FIFA affiliation or endorsement.
- Use conservative language around FIFA data assumptions.
