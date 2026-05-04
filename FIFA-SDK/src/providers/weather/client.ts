import { AbstractProvider } from '../base-provider.js';

export interface WeatherConfig {
  enabled?: boolean;
  apiKey?: string;
}

export interface VenueWeather {
  venueId: string;
  temperatureCelsius: number;
  humidity: number;
  windKph: number;
  condition: string;
  forecastDate: string;
}

/** Client stub for a weather provider to enrich venue context. */
export class WeatherClient extends AbstractProvider {
  readonly name = 'weather';
  readonly enabled: boolean;
  private apiKey: string;

  constructor(config: WeatherConfig = {}) {
    super();
    this.apiKey = config.apiKey ?? process.env['WEATHER_API_KEY'] ?? '';
    this.enabled = (config.enabled ?? false) && this.apiKey.length > 0;
  }

  async fetchForVenue(lat: number, lon: number, date: string): Promise<VenueWeather | null> {
    this.logRequest(`/forecast?lat=${lat}&lon=${lon}&date=${date}`);
    return null;
  }
}
