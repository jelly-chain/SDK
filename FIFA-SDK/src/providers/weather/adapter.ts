import { VenueWeather } from './client.js';

/** Adapts raw weather API responses to normalized VenueWeather objects. */
export class WeatherAdapter {
  normalize(raw: Record<string, unknown>, venueId: string): VenueWeather {
    const current = raw['current'] as Record<string, unknown> ?? raw;
    return {
      venueId,
      temperatureCelsius: Number(current['temp_c'] ?? 20),
      humidity: Number(current['humidity'] ?? 50),
      windKph: Number(current['wind_kph'] ?? 0),
      condition: String((current['condition'] as Record<string, unknown>)?.['text'] ?? 'Unknown'),
      forecastDate: new Date().toISOString(),
    };
  }
}
