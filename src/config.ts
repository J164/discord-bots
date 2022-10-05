import { readFile } from 'node:fs/promises';
import { parse } from 'dotenv';

/** Data parsed from a .env file */
type Config = {
	readonly MONGODB_URL: string;
	readonly ANNOUNCEMENT_TIME: string;
	readonly ANNOUNCEMENT_CHANNEL: string;
	readonly GRADE_UPDATE_INTERVAL: string;
	readonly ADMIN: string;
	readonly STATUS: string;
	readonly DATABASE_NAME: string;
	readonly TOKEN: string;
	readonly SPOTIFY_TOKEN: string;
	readonly DOWNLOAD_DIRECTORY: string;
	readonly ABSTRACT_KEY: string;
	readonly WEATHER_KEY: string;
	readonly IRC_TOKEN: string;
};

/**
 * Parses the .env file at root and ensures all required key-value pairs are present
 * @returns An object containing the key-value pairs from the .env file
 * @throws If any required key-value pairs are missing or empty strings
 */
export async function environment(): Promise<Config> {
	const config = parse(await readFile('.env'));

	const environment: Config = {
		MONGODB_URL: config.MONGODB_URL ?? '',
		ANNOUNCEMENT_TIME: config.ANNOUNCEMENT_TIME ?? '',
		ANNOUNCEMENT_CHANNEL: config.ANNOUNCEMENT_CHANNEL ?? '',
		GRADE_UPDATE_INTERVAL: config.GRADE_UPDATE_INTERVAL ?? '',
		ADMIN: config.ADMIN ?? '',
		STATUS: config.STATUS ?? '',
		DATABASE_NAME: config.DATABASE_NAME ?? '',
		TOKEN: config.TOKEN ?? '',
		SPOTIFY_TOKEN: config.SPOTIFY_TOKEN ?? '',
		DOWNLOAD_DIRECTORY: config.DOWNLOAD_DIRECTORY ?? '',
		ABSTRACT_KEY: config.ABSTRACT_KEY ?? '',
		WEATHER_KEY: config.WEATHER_KEY ?? '',
		IRC_TOKEN: config.IRC_TOKEN ?? '',
	};

	const missing = [];
	for (const [key, option] of Object.entries(environment)) {
		if (!option) {
			missing.push(key);
		}
	}

	if (missing.length > 0) {
		throw new Error(`Please specify the following variable(s) in .env file: ${missing.join(', ')}`);
	}

	return environment;
}
