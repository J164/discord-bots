import { exec, spawn } from 'node:child_process';
import type { YoutubeStream } from '../types/voice.js';

const PRINT_FORMAT =
	'{\\"title\\":\\"%(title)s\\", \\"webpage_url\\":\\"%(webpage_url)s\\", \\"thumbnail\\":\\"%(thumbnail)s\\", \\"duration\\":\\"%(duration)s\\"}';

/**
 * Creates a download stream using yt-dlp
 * @param url the url to stream from
 * @param options yt-dlp options for the stream
 * @returns the child process with the download stream
 */
export function createStream(url: string, options: { format: string }): YoutubeStream {
	return spawn('yt-dlp', [url, '--format', options.format, '--output', '-', '--no-progress', '--quiet'], {
		stdio: ['ignore', 'pipe', 'ignore'],
	});
}

/**
 * Fetches information about a YouTube video
 * @param url The video url
 * @returns A Promise that resolves to the fetched information
 * @throws The Promise is rejected if the fetch fails
 */
export async function resolve(url: string): Promise<YoutubeResolveResult> {
	return new Promise((resolve, reject) => {
		exec(`yt-dlp "${url}" --print "${PRINT_FORMAT}" --no-progress --quiet`, (error, stdout) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(JSON.parse(stdout) as YoutubeResolveResult);
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
