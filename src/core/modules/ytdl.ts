import { ChildProcessByStdio, spawn } from 'node:child_process'
import { Readable } from 'node:stream'

export function createStream(url: string, options: unknown): ChildProcessByStdio<null, Readable, null> {
    return spawn('python3', [ '-u', `./assets/scripts/yt-download.py`, url, JSON.stringify(options) ], { stdio: [ 'ignore', 'pipe', 'ignore' ] })
}

export async function resolve(url: string, options: unknown): Promise<unknown> {
    return new Promise(resolve => {
        const script = spawn('python3', [ '-u', `./assets/scripts/yt-resolve.py`, url, JSON.stringify(options) ], { stdio: [ 'ignore', 'pipe', 'ignore' ] })

        script.stdout.once('data', (data: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            resolve(JSON.parse(data.toString()))
        })
    })
}

export async function download(url: string, options: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = spawn('python3', [ '-u', `./assets/scripts/yt-download.py`, url, JSON.stringify(options) ], { stdio: [ 'ignore', 'pipe', 'ignore' ] })

        script.stdout.once('data', () => {
            script.removeAllListeners('exit')
            reject()
        })
        script.once('exit', () => {
            resolve()
        })
    })
}
