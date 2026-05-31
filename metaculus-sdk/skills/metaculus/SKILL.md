# Metaculus SDK — Agent Skill

Crowd forecasting platform integration — superforecasters, calibration data, non-sports predictions.

## When to Use

- Need crowd-sourced forecasts on science, tech, geopolitics
- Calibrating model probabilities against superforecasters
- Finding high-conviction predictions
- Comparing Metaculus to prediction market prices

## Tools

### metaculus_search
Search questions by topic. Returns community predictions.

### metaculus_get_prediction
Get detailed prediction for a question (community + superforecaster).

### metaculus_get_trending
Get currently trending questions.

## Keys (Optional)

```bash
METACULUS_API_TOKEN=
```

Public API works without key. Key needed for posting predictions.
