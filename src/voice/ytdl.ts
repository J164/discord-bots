import { execFile, spawn } from 'node:child_process';
import { type Buffer } from 'node:buffer';
import { type YoutubeStream } from '../types/voice.js';

const VIDEO_TEMPLATE = '%(title)s;%(webpage_url)s;%(thumbnails.0.url)s;%(duration)s;%(playlist_title)s';
const FORMAT_TEMPLATE = '%(id)s;%(ext)s';

const MAX_DOWNLOAD_SIZE = 1024 * 1024 * 200;

/**
 * Parses YouTube metadata
 * @param data The data to parse
 * @returns parsed YouTube metadata
 */
function parseResolvedFormat(data: string): YoutubeMetadata {
	const [id, ext] = data.trim().split(';');

	return { id, ext };
}

/**
 * Parses Youtube audio data
 * @param data The data to parse
 * @returns Parsed Youtube audio data
 */
function parseResolvedVideo(data: string): YoutubeAudioData[] {
	return data
		.trim()
		.split('\n')
		.map((result) => {
			const [title, url, thumbnail, duration, playlistTitle] = result.trim().split(';');

			const durationNumber = Number.parseInt(duration, 10);

			const hour = Math.floor(durationNumber / 3600);
			const min = Math.floor((durationNumber % 3600) / 60);
			const sec = durationNumber % 60;

			return {
				url,
				title,
				duration: `${hour > 0 ? (hour < 10 ? `0${hour}:` : `${hour}:`) : ''}${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`,
				thumbnail,
				playlistTitle,
			};
		});
}

/**
 * Creates a download stream using yt-dlp
 * @param url The url to stream from
 * @param format The YouTube format to use
 * @returns The child process with the download stream
 */
export function createStream(url: string, format: string): YoutubeStream {
	return spawn('yt-dlp', [url, '--format', format, '--output', '-', '--quiet'], {
		stdio: ['ignore', 'pipe', 'ignore'],
	});
}

/**
 * Fetches information about a YouTube video or playlist
 * @param url The YouTube url
 * @returns A Promise that resolves to the fetched information
 * @throws Promise is rejected if yt-dlp fails
 */
export async function resolve(url: string, playlist?: boolean): Promise<YoutubeAudioData[]> {
	return new Promise((resolve, reject) => {
		execFile(`yt-dlp "${url}" ${playlist ? '--flat-playlist' : '--no-playlist'} --print "${VIDEO_TEMPLATE}" --quiet`, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(parseResolvedVideo(stdout));
		});
	});
}

/**
 * Searches Youtube for videos matching the search terms
 * @param terms The search terms to use
 * @returns A Promise that resolves to information about the fetched videos
 * @throws Promise is rejected if yt-dlp fails
 */
export async function search(terms: string[]): Promise<YoutubeAudioData[]> {
	const searchDirectives = terms
		.map((term) => {
			return `"ytsearch:${term}"`;
		})
		.join(' ');

	return resolve(searchDirectives);
}

/**
 * Fetches metadata for what would be downloaded from a YouTube url
 * @param url The YouTube url
 * @param format The video format to use
 * @returns A Promise that resolves to the metadata
 * @throws Promise is rejected if yt-dlp fails
 */
export async function selectFormat(url: string, format: string): Promise<YoutubeMetadata> {
	return new Promise((resolve, reject) => {
		execFile(`yt-dlp "${url}" --format "${format}" --print "${FORMAT_TEMPLATE}" --quiet`, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(parseResolvedFormat(stdout));
		});
	});
}

/**
 * Downloads a video to a buffer
 * @param url The url to download from
 * @param format The YouTube format to use
 * @returns A Promise that resolves to the downloaded buffer
 * @throws Promise is rejected if download fails
 */
export async function download(url: string, format: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		execFile(`yt-dlp "${url}" --format "${format}" --output "-" --quiet`, { encoding: 'buffer', maxBuffer: MAX_DOWNLOAD_SIZE }, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(stdout);
		});
	});
}
