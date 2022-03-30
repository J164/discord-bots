import { ChildProcessByStdio, exec, spawn } from 'node:child_process';
import { Readable } from 'node:stream';

interface YTResolveResult {
  readonly webpage_url: string;
  readonly title: string;
  readonly thumbnail: string;
  readonly duration: number;
  readonly success: boolean;
}

export function createStream(url: string, options: { format: string }): ChildProcessByStdio<null, Readable, null> {
  return spawn('python3', ['-u', `./assets/scripts/yt-stream.py`, url, JSON.stringify(options)], {
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

export async function resolve(url: string): Promise<YTResolveResult> {
  return new Promise((resolve) => {
    exec(`python3 -u ./assets/scripts/yt-resolve.py "${url}"`, (error, stdout) => {
      resolve(JSON.parse(stdout) as YTResolveResult);
    });
  });
}

export async function download(url: string, options: { outtmpl: string; format: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`python3 -u ./assets/scripts/yt-download.py "${url}" "${JSON.stringify(options).replaceAll('"', '\\"')}"`, (error) => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}
