import { ChildProcessByStdio, spawn } from 'node:child_process'
import { Duplex, Readable, Writable } from 'node:stream'

export async function createStream(options: unknown): Promise<{ stream: Readable, script: ChildProcessByStdio<Writable, Readable, null>}> {
    return new Promise((resolve: (value: { stream: Readable, script: ChildProcessByStdio<Writable, Readable, null>}) => void) => {
        const script = spawn('python3', [ '-u', `./assets/scripts/ytdl.py` ], { stdio: [ 'pipe', 'pipe', 'ignore' ] })

        script.stdout.once('data', () => {
            script.stdout.once('data', (data: unknown) => {
                const stream = new Duplex({
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    read() {},
                    write(chunk, encoding, callback) {
                        stream.push(chunk)
                        callback()
                    },
                })

                stream.push(data)
                script.stdout.pipe(stream)
                resolve({ stream: stream, script: script })
            })
            script.stdin.write(`${JSON.stringify(options)}\n`)
        })
    })
}

export async function resolve(options: unknown): Promise<string> {
    return new Promise((resolve: (value: string) => void) => {
        const script = spawn('python3', [ '-u', `./assets/scripts/ytdl.py` ], { stdio: [ 'pipe', 'pipe', 'ignore' ] })

        script.stdout.once('data', () => {
            script.stdout.once('data', (data: unknown) => {
                resolve(data.toString())
            })
            script.stdin.write(`${JSON.stringify(options)}\n`)
        })
    })
}

export async function download(options: unknown): Promise<boolean> {
    return new Promise((resolve: (value: boolean) => void) => {
        const script = spawn('python3', [ '-u', `./assets/scripts/ytdl.py` ], { stdio: [ 'pipe', 'pipe', 'ignore' ] })

        script.stdout.once('data', () => {
            script.stdout.once('data', () => {
                resolve(false)
            })
            script.once('exit', () => {
                resolve(true)
            })
            script.stdin.write(`${JSON.stringify(options)}\n`)
        })
    })
}
