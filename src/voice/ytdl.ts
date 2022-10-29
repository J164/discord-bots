import { exec } from 'node:child_process';

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
