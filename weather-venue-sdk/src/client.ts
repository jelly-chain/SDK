import type { WeatherVenueConfig, VenueLocation, WeatherForecast } from './types.js';

export class WeatherVenueClient {
  private readonly apiKey: string;
  private readonly provider: string;
  readonly enabled: boolean;
  private venues: Map<string, VenueLocation> = new Map();

  constructor(config: WeatherVenueConfig = {}) {
    this.apiKey = config.apiKey ?? process.env['WEATHER_API_KEY'] ?? '';
    this.provider = config.provider ?? 'openweathermap';
    this.enabled = config.enabled !== false && !!this.apiKey;
  }

  registerVenue(venue: VenueLocation): void {
    this.venues.set(venue.id, venue);
  }

  registerVenues(venues: VenueLocation[]): void {
    for (const v of venues) this.registerVenue(v);
  }

  getVenue(venueId: string): VenueLocation | undefined {
    return this.venues.get(venueId);
  }

  async getForecast(venueId: string, date: string): Promise<WeatherForecast | null> {
    const venue = this.venues.get(venueId);
    if (!venue || !this.enabled) return null;

    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${venue.latitude}&lon=${venue.longitude}&appid=${this.apiKey}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json() as Record<string, unknown>;
      return this.normalizeForecast(data, venue, date);
    } catch {
      return null;
    }
  }

  async getCurrentWeather(venueId: string): Promise<WeatherForecast | null> {
    const venue = this.venues.get(venueId);
    if (!venue || !this.enabled) return null;

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${venue.latitude}&lon=${venue.longitude}&appid=${this.apiKey}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json() as Record<string, unknown>;
      return this.normalizeCurrent(data, venue);
    } catch {
      return null;
    }
  }

  private normalizeForecast(data: Record<string, unknown>, venue: VenueLocation, targetDate: string): WeatherForecast | null {
    const list = (data['list'] as Array<Record<string, unknown>>) ?? [];
    const target = new Date(targetDate).getTime();
    let closest = list[0];
    let minDiff = Infinity;

    for (const item of list) {
      const dt = (item.dt as number) * 1000;
      const diff = Math.abs(dt - target);
      if (diff < minDiff) { minDiff = diff; closest = item; }
    }

    if (!closest) return null;
    return this.normalizeCurrent({ ...closest, coord: { lat: venue.latitude, lon: venue.longitude } } as Record<string, unknown>, venue);
  }

  private normalizeCurrent(data: Record<string, unknown>, venue: VenueLocation): WeatherForecast {
    const main = data['main'] as Record<string, number> ?? {};
    const wind = data['wind'] as Record<string, number> ?? {};
    const weather = (data['weather'] as Array<Record<string, unknown>>)?.[0] ?? {};
    const rain = data['rain'] as Record<string, number> ?? {};

    return {
      venueId: venue.id,
      date: new Date().toISOString(),
      temperature: {
        current: main.temp ?? 20,
        feelsLike: main.feels_like ?? 20,
        min: main.temp_min ?? 20,
        max: main.temp_max ?? 20,
      },
      wind: {
        speed: wind.speed ? wind.speed * 3.6 : 0,
        direction: this.degToCompass(wind.deg ?? 0),
        gusts: wind.gust ? wind.gust * 3.6 : undefined,
      },
      precipitation: {
        amount: rain['1h'] ?? 0,
        chance: 0,
        type: (main.temp ?? 20) < 0 ? 'snow' : (rain['1h'] ?? 0) > 0 ? 'rain' : 'none',
      },
      humidity: main.humidity ?? 50,
      visibility: Number(data['visibility'] ?? 10000),
      uvIndex: 0,
      condition: String(weather.main ?? 'Unknown'),
      conditionCode: Number(weather.id ?? 800),
    };
  }

  private degToCompass(deg: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  }
}
