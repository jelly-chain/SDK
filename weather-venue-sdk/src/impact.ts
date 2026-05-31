import type { WeatherForecast, WeatherImpact, VenueLocation } from './types.js';

export class WeatherImpactAnalyzer {
  analyze(venue: VenueLocation, forecast: WeatherForecast): WeatherImpact {
    const factors: string[] = [];
    let severity: WeatherImpact['overallImpact'] = 'none';

    // Temperature impact
    if (forecast.temperature.current > 35) {
      factors.push('Extreme heat — fatigue risk, hydration critical');
      severity = 'severe';
    } else if (forecast.temperature.current > 30) {
      factors.push('High temperature — expect slower tempo');
      severity = 'moderate';
    } else if (forecast.temperature.current < 0) {
      factors.push('Freezing conditions — muscle injury risk');
      severity = 'moderate';
    }

    // Wind impact
    if (forecast.wind.speed > 50) {
      factors.push(`Strong wind (${forecast.wind.speed.toFixed(0)} km/h) — affects crosses, long balls, kicks`);
      severity = 'severe';
    } else if (forecast.wind.speed > 30) {
      factors.push(`Moderate wind (${forecast.wind.speed.toFixed(0)} km/h) — some impact on aerial play`);
      if (severity === 'none') severity = 'minor';
    }

    // Rain impact
    if (forecast.precipitation.amount > 10) {
      factors.push('Heavy rain — slippery surface, defensive errors likely');
      severity = 'severe';
    } else if (forecast.precipitation.amount > 2) {
      factors.push('Light rain — surface may be slick');
      if (severity === 'none') severity = 'minor';
    }

    // Snow
    if (forecast.precipitation.type === 'snow') {
      factors.push('Snow expected — pitch conditions unpredictable');
      severity = 'severe';
    }

    // Altitude
    if (venue.altitude > 2000) {
      factors.push(`High altitude (${venue.altitude}m) — affects ball flight and player conditioning`);
      if (severity === 'none') severity = 'minor';
    }

    // Dome check
    if (venue.isDome) {
      return {
        venueId: venue.id,
        sport: venue.sport,
        overallImpact: 'none',
        factors: ['Dome/retractable roof — weather not a factor'],
        playingStyle: 'Normal conditions',
        setPieceImpact: 'None',
        fatigueImpact: 'None',
        bettingAngle: 'No weather edge',
        confidence: 0.95,
      };
    }

    // Playing style impact
    let playingStyle = 'Normal conditions';
    if (forecast.wind.speed > 30) playingStyle = 'Direct play favored, long balls affected';
    if (forecast.precipitation.amount > 5) playingStyle = 'Ground game preferred, possession risky';

    // Betting angle
    let bettingAngle = 'No significant weather edge';
    if (severity === 'severe') bettingAngle = 'Consider unders — weather reduces quality';
    if (forecast.wind.speed > 40) bettingAngle = 'Unpredictable — avoid spreads, consider goal props';
    if (forecast.temperature.current > 32) bettingAngle = 'Heat favors unders — second half fatigue';

    return {
      venueId: venue.id,
      sport: venue.sport,
      overallImpact: severity,
      factors,
      playingStyle,
      setPieceImpact: forecast.wind.speed > 30 ? 'High — wind affects delivery' : 'Normal',
      fatigueImpact: forecast.temperature.current > 30 ? 'High — heat saps energy' : 'Normal',
      bettingAngle,
      confidence: 0.7,
    };
  }

  getSeasonalTrend(venue: VenueLocation, month: number): {
    typicalTemp: number;
    typicalRain: number;
    recommendation: string;
  } {
    // Simplified seasonal data — would use historical averages in production
    const isNorthern = venue.latitude > 0;
    const season = isNorthern
      ? (month >= 4 && month <= 9 ? 'summer' : 'winter')
      : (month >= 4 && month <= 9 ? 'winter' : 'summer');

    return {
      typicalTemp: season === 'summer' ? 25 : 10,
      typicalRain: season === 'summer' ? 2 : 5,
      recommendation: season === 'summer' ? 'Typically favorable conditions' : 'Expect weather factors',
    };
  }
}
