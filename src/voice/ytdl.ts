import { exec, spawn } from 'node:child_process';
import type { YoutubeResolveResult, YoutubeAudioData, YoutubePlaylistResolveResult } from '../types/api.js';
import type { YoutubeStream } from '../types/voice.js';
import { AudioTypes } from '../types/voice.js';

const PRINT_FORMAT = '\\"title\\":\\"%(title)s\\",\\"url\\":\\"%(webpage_url)s\\",\\"thumbnails\\":\\"%(thumbnails)s\\",\\"duration\\":\\"%(duration)s\\"';
const PLAYLIST_PRINT_FORMAT = `${PRINT_FORMAT},\\"playlistTitle\\":\\"%(playlist_title)s\\"`;

/**
 * Parses Youtube audio data
 * @param data the data to parse
 * @returns parsed Youtube audio data
 */
function parseResolvedData(data: YoutubeResolveResult[]): YoutubeAudioData[] {
	return data.map((item) => {
		const { url, title, duration, thumbnails } = item;

		const durationNumber = Number.parseInt(duration, 10);

		const hour = Math.floor(durationNumber / 3600);
		const min = Math.floor((durationNumber % 3600) / 60);
		const sec = durationNumber % 60;

		const thumbnailsArray = JSON.parse(thumbnails.replaceAll("'", '"')) as Array<{ url: string }>;

		return {
			url,
			title,
			duration: `${hour > 0 ? (hour < 10 ? `0${hour}:` : `${hour}:`) : ''}${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`,
			thumbnail: thumbnailsArray[0].url,
			type: AudioTypes.YouTube,
		};
	});
}

/**
 * Creates a download stream using yt-dlp
 * @param url the url to stream from
 * @param options yt-dlp options for the stream
 * @returns the child process with the download stream
 */
export function createStream(url: string, options: { format: string }): YoutubeStream {
	return spawn('yt-dlp', [url, '--format', options.format, '--output', '-', '--quiet'], {
		stdio: ['ignore', 'pipe', 'ignore'],
	});
}

/**
 * Fetches information about a YouTube video
 * @param url The video url
 * @returns A Promise that resolves to the fetched information
 * @throws The Promise is rejected if the fetch fails
 */
export async function resolve(url: string): Promise<YoutubeAudioData[]> {
	return new Promise((resolve, reject) => {
		exec(`yt-dlp "${url}" --no-playlist --print "{${PRINT_FORMAT}}" --quiet`, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(parseResolvedData([JSON.parse(stdout) as YoutubeResolveResult]));
		});
	});
}

/**
 * Fetches information about a YouTube playlist
 * @param url The playlsit url
 * @returns A Promise that resolves to the fetched information
 * @throws The Promise is rejected if the fetch fails
 */
export async function resolvePlaylist(url: string): Promise<YoutubePlaylistResolveResult> {
	return new Promise((resolve, reject) => {
		exec(`yt-dlp "${url}" --flat-playlist --print "{${PLAYLIST_PRINT_FORMAT}}" --quiet`, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}

			const results = stdout
				.trim()
				.split('\n')
				.map((result) => {
					return JSON.parse(result) as YoutubeResolveResult & { playlistTitle: string };
				});

			if (results.length === 0) {
				reject();
				return;
			}

			resolve({
				results: parseResolvedData(results),
				playlistTitle: results[0].playlistTitle,
			});
		});
	});
}

/**
 * Downloads a video to the operating system
 * @param url The url to download from
 * @param options Yt-dlp options for the download
 * @returns A void Promise that resolves when the download is complete
 * @throws The Promise is rejected if the download fails
 */
export async function download(url: string, options: { output: string; format: string }): Promise<void> {
	return new Promise((resolve, reject) => {
		exec(`yt-dlp "${url}" --output "${options.output}" --format "${options.format}"`, (error) => {
			if (error) {
				reject(error);
				return;
			}

			resolve();
		});
	});
}

/**
 * Searches Youtube for videos matching the search terms
 * @param terms The search terms to use
 * @returns A Promise that resolves to information about the fetched videos
 * @throws The Promise is rejected if the search or fetch fails
 */
export async function search(terms: string[]): Promise<YoutubeAudioData[]> {
	return new Promise((resolve, reject) => {
		const searchDirectives = terms
			.map((term) => {
				return `"ytsearch:${term}"`;
			})
			.join(' ');

		exec(`yt-dlp ${searchDirectives} --print "{${PRINT_FORMAT}}" --quiet`, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}

			const results = stdout
				.trim()
				.split('\n')
				.map((result) => {
					return JSON.parse(result) as YoutubeResolveResult;
				});

			if (results.length === 0) {
				reject();
				return;
			}

			resolve(parseResolvedData(results));
		});
	});
}
