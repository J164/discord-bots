import dargs from 'dargs'
import { execa, ExecaChildProcess, Options } from 'execa'

export type YtResponse = {
    title: string,
    duration: number,
    view_count: number,
    thumbnail: string,
    webpage_url: string,
}

type YtFlags = {
    output?: string,
    quiet?: boolean,
    print?: string,
    verbose?: boolean,
    format?: string,
    limitRate?: string
}

export function raw(url: string, flags?: YtFlags, opts?: Options<string>): ExecaChildProcess<string> {
    return execa(process.env.dev ? `./assets/binaries/yt-dlp.exe` : `./assets/binaries/yt-dlp`, [].concat(url, dargs(flags, { useEquals: false })).filter(Boolean), opts)
}

export async function ytdl(url: string, flags?: YtFlags, opts?: Options<string>): Promise<YtResponse> {
    const { stdout } = await raw(url, flags, opts)
    return stdout?.startsWith('{') ? JSON.parse(stdout) : stdout
}