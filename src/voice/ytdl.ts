import { ChildProcessByStdio, exec, spawn } from 'node:child_process';
import { Readable } from 'node:stream';

/**
 * Data returned from YT-DLP about a YouTube video
 */
interface YTResolveResult {
  readonly webpage_url: string;
  readonly title: string;
  readonly thumbnail: string;
  readonly duration: number;
}

/**
 * Creates a download stream using YT-DLP
 * @param url the url to stream form
 * @param options YT-DLP options for the stream
 * @returns the child process with the download stream
 */
export function createStream(url: string, options: { format: string }): ChildProcessByStdio<null, Readable, null> {
  return spawn('python3', ['-u', `./scripts/yt-stream.py`, url, JSON.stringify(options)], {
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

/**
 * Fetches information about a YouTube video
 * @param url the video url
 * @returns the fetched information
 */
export async function resolve(url: string): Promise<YTResolveResult> {
  return new Promise((resolve, reject) => {
    exec(`python3 -u ./scripts/yt-resolve.py "${url}"`, (error, stdout) => {
      if (error) {
        return reject(error);
      }
      resolve(JSON.parse(stdout) as YTResolveResult);
    });
  });
}

/**
 * Downloads a video to the operating system
 * @param url the url to download from
 * @param options YT-DLP options for the download
 * @returns
 */
export async function download(url: string, options: { outtmpl: string; format: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`python3 -u ./scripts/yt-download.py "${url}" "${JSON.stringify(options).replaceAll('"', '\\"')}"`, (error) => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}
