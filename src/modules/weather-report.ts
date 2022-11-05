import type { WeatherResponse } from '../types/api.js';

/**
 * Fetches infomation about the weather for a specific date
 * @param weatherKey The API key for the Weather API
 * @returns A Promise that resolves to the response from the Weather API or undefined if the request failed
 */
export async function getWeatherReport(weatherKey: string): Promise<WeatherResponse | undefined> {
	const date = new Date();
	const response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${weatherKey}&q=60069&dt=${date.toISOString().split('T')[0]}`);

	if (!response.ok) {
		return;
	}

	return response.json() as Promise<WeatherResponse>;
}
