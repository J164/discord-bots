/**
 * Fetches infomation about the weather for a specific date
 * @param date The date to fetch weather data about
 * @param weatherKey The API key for the Weather API
 * @returns A Promise that resolves to the response from the Weather API or undefined if the request failed
 */
export async function getWeatherReport(date: Date, weatherKey: string): Promise<WeatherResponse | undefined> {
	const response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${weatherKey}&q=60069&dt=${date.toISOString().split('T')[0]}`);

	if (!response.ok) {
		return;
	}

	return response.json() as Promise<WeatherResponse>;
}
