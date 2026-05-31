# Weather impact workflow

Goal: model how weather/travel conditions may affect performance and betting markets.

## Inputs
- Venue/location (or teams + venue mapping)
- Kickoff time (for forecasts)
- Weather factors to consider (rain, wind, heat, humidity)

## Steps
1. Obtain forecast inputs
   - Temperature, precipitation probability, wind speed/direction.
2. Map weather to sport-specific effects
   - For example: passing vs ground conditions; ball carry; injury likelihood.
3. Update priors
   - Adjust scoring expectations and variance assumptions.
4. Quantify uncertainty
   - Forecast confidence and whether weather is improving/worsening.
5. Produce structured output
   - Risk flags when forecast changes frequently.

## Outputs
- `WeatherImpactContext`
  - forecast summary
  - expected effect direction
  - confidence/risk flags
