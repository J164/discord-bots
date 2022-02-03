import { ChildProcessByStdio, spawn } from 'node:child_process'
import { Readable } from 'node:stream'

export function createStream(options: unknown): ChildProcessByStdio<null, Readable, null> {
    return spawn('python3', [ '-u', `./assets/scripts/ytdl.py`, 'stream', JSON.stringify(options) ], { stdio: [ 'ignore', 'pipe', 'ignore' ] })
}

export async function resolve(options: unknown): Promise<unknown> {
    return new Promise((resolve: (value: string) => void) => {
        const script = spawn('python3', [ '-u', `./assets/scripts/ytdl.py`, 'resolve', JSON.stringify(options) ], { stdio: [ 'ignore', 'pipe', 'ignore' ] })

        script.stdout.once('data', (data: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            resolve(JSON.parse(data.toString()))
        })
    })
}

export async function download(options: unknown): Promise<boolean> {
    return new Promise((resolve: (value: boolean) => void) => {
        const script = spawn('python3', [ '-u', `./assets/scripts/ytdl.py`, 'download', JSON.stringify(options) ], { stdio: [ 'ignore', 'pipe', 'ignore' ] })

        script.stdout.once('data', () => {
            resolve(false)
        })
        script.once('exit', () => {
            resolve(true)
        })
    })
}
