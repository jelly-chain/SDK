export interface WeatherVenueConfig {
  apiKey?: string;
  provider?: 'openweathermap' | 'weatherapi' | 'visual-crossing';
  enabled?: boolean;
}

export interface VenueLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  altitude: number; // meters
  sport: string;
  isDome: boolean;
}

export interface WeatherForecast {
  venueId: string;
  date: string;
  temperature: { current: number; feelsLike: number; min: number; max: number };
  wind: { speed: number; direction: string; gusts?: number };
  precipitation: { amount: number; chance: number; type: 'rain' | 'snow' | 'none' };
  humidity: number;
  visibility: number;
  uvIndex: number;
  condition: string;
  conditionCode: number;
}

export interface WeatherImpact {
  venueId: string;
  sport: string;
  overallImpact: 'none' | 'minor' | 'moderate' | 'severe';
  factors: string[];
  playingStyle: string;
  setPieceImpact: string;
  fatigueImpact: string;
  bettingAngle: string;
  confidence: number;
}
