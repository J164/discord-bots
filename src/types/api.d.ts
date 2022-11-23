// Scryfall API (https://scryfall.com/docs/api)

/** Response data from Scryfall */
type ScryfallResponse = {
	readonly status?: string;
	readonly data: ScryfallMagicCard[];
};

/** A Magic card from Scryfall */
type ScryfallMagicCard = {
	readonly name: string;
	readonly uri: string;
	readonly image_uris?: {
		readonly large: string;
	};
	readonly card_faces?: ReadonlyArray<{
		readonly image_uris: {
			readonly large: string;
		};
	}>;
	readonly prices: {
		readonly usd: string;
	};
};

// Deckstats API (https://deckstats.net/forum/index.php?topic=41323.0)

/** Response data from Deckstats */
type DeckstatsResponse = {
	readonly name: string;
	readonly sections: ReadonlyArray<{
		readonly cards: ReadonlyArray<{
			readonly name: string;
			readonly isCommander: boolean;
		}>;
	}>;
};

// Spotify API (https://developer.spotify.com/documentation/web-api/reference/#/)

/** Metadata about an audio track from Spotify */
type SpotifyTrack = {
	readonly name: string;
	readonly artists: ReadonlyArray<{
		readonly name: string;
	}>;
};

/** Response data from Spotify */
type SpotifyResponse = {
	readonly name: string;
	readonly external_urls: { readonly spotify: string };
	readonly images: ReadonlyArray<{ readonly url: string }>;
	readonly tracks: {
		readonly items: ReadonlyArray<{
			readonly track: SpotifyTrack;
		}>;
	};
};

// Wynncraft API (https://docs.wynncraft.com/)

/** Response data from Wynncraft */
type WynncraftResponse = {
	readonly data: ReadonlyArray<{
		readonly username: string;
		readonly meta: {
			readonly location: {
				readonly online: boolean;
				readonly server: string;
			};
		};
		readonly classes: ReadonlyArray<{
			readonly name: string;
			readonly playtime: number;
			readonly professions: {
				readonly combat: {
					readonly level: number;
				};
			};
		}>;
	}>;
};

// ZenQuotes API (https://premium.zenquotes.io/zenquotes-documentation/)

/** Response data from ZenQuotes */
type ZenQuotesResponse = {
	readonly q: string;
	readonly a: string;
};

// Holdiays Abstract API (https://www.abstractapi.com/api/holidays-api#docs)

/** Response data from the Holidays Abstract API */
type HolidayResponse = {
	readonly name: string;
	readonly description: string;
};

// WeatherAPI (https://www.weatherapi.com/docs/)

/** Object representing a weather condition */
type WeatherCondition = {
	readonly text: string;
	readonly code: number;
};

/** Response data from WeatherAPI */
type WeatherResponse = {
	readonly forecast: {
		readonly forecastday: Array<{
			readonly day: {
				readonly condition: WeatherCondition;
				readonly maxtemp_f: number;
				readonly mintemp_f: number;
				readonly daily_will_it_rain: 0 | 1; // 0 = No, 1 = Yes
				readonly daily_will_it_snow: 0 | 1; // 0 = No, 1 = Yes
			};
			readonly astro: {
				readonly sunrise: string;
				readonly sunset: string;
				readonly moon_phase: string;
			};
			readonly hour: Array<{
				readonly condition: WeatherCondition;
				readonly feelslike_f: number;
				readonly will_it_rain: 0 | 1;
				readonly will_it_snow: 0 | 1;
				readonly chance_of_rain: number;
				readonly chance_of_snow: number;
			}>;
		}>;
	};
};

// Yt-dlp (https://github.com/yt-dlp/yt-dlp)

/** Metadata about a YouTube video */
type YoutubeAudioData = {
	readonly url: string;
	readonly title: string;
	readonly thumbnail: string;
	readonly duration: string;
	readonly playlistTitle: string;
};

/** Metadata from downloading a Youtube video */
type YoutubeMetadata = {
	id: string;
	ext: string;
};

// Tenor API

/** Data returned from a Tenor search */
type TenorResponse = {
	readonly results: ReadonlyArray<{
		readonly itemurl: string;
	}>;
};
