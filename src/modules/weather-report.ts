import config from '../config.json' assert { type: 'json' };

/**
 * Object representing a weather condition
 */
interface WeatherCondition {
  readonly text: string;
  readonly code: number;
}

/**
 * Response data from the weather API
 */
export interface WeatherResponse {
  readonly forecast: {
    readonly forecastday: {
      readonly day: {
        readonly condition: WeatherCondition;
        readonly maxtemp_f: number;
        readonly mintemp_f: number;
        readonly daily_will_it_rain: 0 | 1; //0 = No, 1 = Yes
        readonly daily_will_it_snow: 0 | 1; //0 = No, 1 = Yes
      };
      readonly astro: {
        readonly sunrise: string;
        readonly sunset: string;
        readonly moon_phase: string;
      };
      readonly hour: {
        readonly condition: WeatherCondition;
        readonly feelslike_f: number;
        readonly will_it_rain: 0 | 1;
        readonly will_it_snow: 0 | 1;
        readonly chance_of_rain: number;
        readonly chance_of_snow: number;
      }[];
    }[];
  };
}

export function partialISOString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getWeatherReport(date: Date): Promise<WeatherResponse> {
  return (await (
    await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${config.WEATHER_KEY}&q=60069&dt=${partialISOString(date)}`)
  ).json()) as WeatherResponse;
}
