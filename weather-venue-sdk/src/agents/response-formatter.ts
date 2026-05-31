/**
 * Format Weather data for agent-friendly output
 */

import type { WeatherForecast, WeatherImpact, VenueLocation } from '../types.js';

export class ResponseFormatter {
  static formatForecast(forecast: WeatherForecast, venue?: VenueLocation): string {
    const parts: string[] = [];
    parts.push(`🌤️ Weather Forecast${venue ? ` for ${venue.name}` : ''}`);
    parts.push(`   Temperature: ${forecast.temperature.current}°C (Feels like: ${forecast.temperature.feelsLike}°C)`);
    parts.push(`   Wind: ${forecast.wind.speed} km/h ${forecast.wind.direction}`);
    parts.push(`   Precipitation: ${forecast.precipitation.amount}mm (${forecast.precipitation.chance}% chance)`);
    parts.push(`   Humidity: ${forecast.humidity}%`);
    parts.push(`   Condition: ${forecast.condition}`);
    return parts.join('\n');
  }

  static formatImpact(impact: WeatherImpact): string {
    const parts: string[] = [];
    parts.push(`⚡ Weather Impact Assessment`);
    parts.push(`   Overall Impact: ${impact.overallImpact.toUpperCase()}`);
    parts.push(`   Confidence: ${(impact.confidence * 100).toFixed(0)}%`);

    if (impact.factors.length > 0) {
      parts.push(`\n   Factors:`);
      for (const factor of impact.factors) {
        parts.push(`   - ${factor}`);
      }
    }

    parts.push(`\n   Playing Style: ${impact.playingStyle}`);
    parts.push(`   Set Piece Impact: ${impact.setPieceImpact}`);
    parts.push(`   Fatigue Impact: ${impact.fatigueImpact}`);
    parts.push(`\n   🎯 Betting Angle: ${impact.bettingAngle}`);

    return parts.join('\n');
  }

  static formatForPrediction(forecast: WeatherForecast, impact: WeatherImpact, venue?: VenueLocation): string {
    const parts: string[] = [];
    parts.push(`## Weather Context${venue ? ` — ${venue.name}` : ''}`);
    parts.push(this.formatForecast(forecast, venue));
    parts.push('\n' + this.formatImpact(impact));
    return parts.join('\n');
  }
}
