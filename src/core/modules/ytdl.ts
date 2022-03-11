import { ChildProcessByStdio, exec, spawn } from 'node:child_process'
import { Readable } from 'node:stream'

export function createStream(url: string, options: unknown): ChildProcessByStdio<null, Readable, null> {
    return spawn('python3', [ '-u', `./assets/scripts/yt-stream.py`, url, JSON.stringify(options) ], { stdio: [ 'ignore', 'pipe', 'ignore' ] })
}

export async function resolve(url: string): Promise<unknown> {
    return new Promise(resolve => {
        exec(`python3 -u ./assets/scripts/yt-resolve.py ${url}`, (error, stdout) => {
            resolve(JSON.parse(stdout))
        })
    })
}

export async function download(url: string, options: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(`python3 -u ./assets/scripts/yt-download.py ${url} ${JSON.stringify(options).replaceAll('"', '\\"')}`, (error) => {
            if (error) {
                return reject()
            }
            return resolve()
        })
    })
}
