/** Raw response types for the weather provider. */

export interface RawWeatherCondition {
  text: string;
  code: number;
}

export interface RawWeatherCurrent {
  temp_c: number;
  humidity: number;
  wind_kph: number;
  condition: RawWeatherCondition;
}

export interface RawWeatherResponse {
  location: { name: string; lat: number; lon: number };
  current?: RawWeatherCurrent;
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        avgtemp_c: number;
        avghumidity: number;
        maxwind_kph: number;
        condition: RawWeatherCondition;
      };
    }>;
  };
}
