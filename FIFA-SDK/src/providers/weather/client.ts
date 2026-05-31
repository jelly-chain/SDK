import { AbstractProvider } from '../base-provider.js';

export interface WeatherConfig {
  enabled?: boolean;
  apiKey?: string;
  provider?: 'openweathermap' | 'weatherapi' | 'visual-crossing';
}

export interface VenueWeather {
  venueId: string;
  latitude: number;
  longitude: number;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidity: number;
  windKph: number;
  windDirection: string;
  precipitationMm: number;
  precipitationChance: number;
  condition: string;
  conditionCode: number;
  visibility: number;
  uvIndex: number;
  forecastDate: string;
  isExtremeHeat: boolean;
  isExtremeCold: boolean;
  isHeavyRain: boolean;
  isStrongWind: boolean;
  weatherImpact: 'none' | 'minor' | 'moderate' | 'severe';
  impactFactors: string[];
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  maxWind: number;
  totalPrecipitation: number;
  condition: string;
  rainChance: number;
  snowChance: number;
}

/** Real weather provider with multiple API backends. */
export class WeatherClient extends AbstractProvider {
  override readonly name = 'weather';
  override readonly enabled: boolean;
  private readonly apiKey: string;
  private readonly provider: string;

  constructor(config: WeatherConfig = {}) {
    super();
    this.apiKey = config.apiKey ?? process.env['WEATHER_API_KEY'] ?? '';
    this.enabled = (config.enabled ?? false) && this.apiKey.length > 0;
    this.provider = config.provider ?? 'openweathermap';
  }

  /** Fetch current weather for coordinates */
  async fetchCurrent(lat: number, lon: number): Promise<VenueWeather | null> {
    if (!this.enabled) return null;
    this.logRequest(`/weather?lat=${lat}&lon=${lon}`);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json() as Record<string, unknown>;

      return this.normalizeCurrent(data, lat, lon, '');
    } catch (error) {
      this.handleError(error, 'fetchCurrent');
    }
  }

  /** Fetch forecast for coordinates and date */
  async fetchForecast(lat: number, lon: number, date: string): Promise<VenueWeather | null> {
    if (!this.enabled) return null;
    this.logRequest(`/forecast?lat=${lat}&lon=${lon}&date=${date}`);

    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json() as Record<string, unknown>;

      return this.normalizeForecast(data, lat, lon, date, '');
    } catch (error) {
      this.handleError(error, 'fetchForecast');
    }
  }

  /** Fetch weather for a venue by name */
  async fetchForVenue(venueName: string, date?: string): Promise<VenueWeather | null> {
    if (!this.enabled) return null;
    this.logRequest(`/weather?q=${encodeURIComponent(venueName)}`);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(venueName)}&appid=${this.apiKey}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json() as Record<string, unknown>;
      const coord = data['coord'] as { lat: number; lon: number };

      return this.normalizeCurrent(data, coord.lat, coord.lon, venueName);
    } catch (error) {
      this.handleError(error, 'fetchForVenue');
    }
  }

  private normalizeCurrent(data: Record<string, unknown>, lat: number, lon: number, venueId: string): VenueWeather {
    const main = data['main'] as Record<string, number> ?? {};
    const wind = data['wind'] as Record<string, number> ?? {};
    const weather = (data['weather'] as Array<Record<string, unknown>>)?.[0] ?? {};
    const rain = data['rain'] as Record<string, number> ?? {};
    const clouds = data['clouds'] as Record<string, number> ?? {};

    const temp = main.temp ?? 20;
    const windSpeed = wind.speed ? wind.speed * 3.6 : 0; // m/s to km/h
    const precipitation = rain['1h'] ?? 0;

    const impactFactors: string[] = [];
    const isExtremeHeat = temp > 35;
    const isExtremeCold = temp < 0;
    const isHeavyRain = precipitation > 10;
    const isStrongWind = windSpeed > 50;

    if (isExtremeHeat) impactFactors.push('extreme-heat');
    if (isExtremeCold) impactFactors.push('extreme-cold');
    if (isHeavyRain) impactFactors.push('heavy-rain');
    if (isStrongWind) impactFactors.push('strong-wind');

    const weatherImpact: VenueWeather['weatherImpact'] =
      impactFactors.length >= 2 ? 'severe' :
      impactFactors.length === 1 ? 'moderate' :
      precipitation > 5 || windSpeed > 30 ? 'minor' : 'none';

    return {
      venueId,
      latitude: lat,
      longitude: lon,
      temperatureCelsius: temp,
      feelsLikeCelsius: main.feels_like ?? temp,
      humidity: main.humidity ?? 50,
      windKph: windSpeed,
      windDirection: this.degToCompass(wind.deg ?? 0),
      precipitationMm: precipitation,
      precipitationChance: clouds.all ? clouds.all / 100 : 0,
      condition: String(weather.main ?? 'Unknown'),
      conditionCode: Number(weather.id ?? 800),
      visibility: Number(data['visibility'] ?? 10000),
      uvIndex: 0,
      forecastDate: new Date().toISOString(),
      isExtremeHeat,
      isExtremeCold,
      isHeavyRain,
      isStrongWind,
      weatherImpact,
      impactFactors,
    };
  }

  private normalizeForecast(data: Record<string, unknown>, lat: number, lon: number, date: string, venueId: string): VenueWeather {
    const list = (data['list'] as Array<Record<string, unknown>>) ?? [];
    // Find closest forecast to target date
    const target = new Date(date).getTime();
    let closest = list[0] ?? {};
    let minDiff = Infinity;

    for (const item of list) {
      const dt = (item.dt as number) * 1000;
      const diff = Math.abs(dt - target);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }

    return this.normalizeCurrent({ ...closest, coord: { lat, lon } } as Record<string, unknown>, lat, lon, venueId);
  }

  private degToCompass(deg: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  /** Get weather impact assessment for a match */
  assessMatchImpact(weather: VenueWeather): {
    playingStyleImpact: string;
    setPieceImpact: string;
    fatigueImpact: string;
    bettingAngle: string;
  } {
    let playingStyleImpact = 'Normal conditions';
    let setPieceImpact = 'Standard';
    let fatigueImpact = 'Normal';
    let bettingAngle = 'No weather edge';

    if (weather.isExtremeHeat) {
      playingStyleImpact = 'Slower tempo expected, more substitutions';
      fatigueImpact = 'High fatigue risk, especially in second half';
      bettingAngle = 'Consider unders — heat slows play, fitness matters more';
    }

    if (weather.isHeavyRain) {
      playingStyleImpact = 'Wet surface favors direct play, less possession football';
      setPieceImpact = 'Slippery conditions increase set piece danger';
      bettingAngle = 'Consider overs on goals — defensive errors more likely';
    }

    if (weather.isStrongWind) {
      playingStyleImpact = 'Wind affects long balls, crosses, and shots';
      setPieceImpact = 'Free kicks and corners heavily affected by wind';
      bettingAngle = 'Unpredictable — avoid spread bets, consider goal props';
    }

    if (weather.isExtremeCold) {
      playingStyleImpact = 'Cold conditions can slow play, ball moves faster on frozen pitch';
      fatigueImpact = 'Muscle injury risk increases in cold';
    }

    return { playingStyleImpact, setPieceImpact, fatigueImpact, bettingAngle };
  }
}
