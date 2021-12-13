import { ChildProcess, fork } from 'child_process'
import { writeFileSync } from 'fs'

export class BotSubprocess {
    private process: ChildProcess
    private online: boolean
    private fails: number
    private readonly path: string
    private readonly config: NodeJS.ProcessEnv
    public readonly name: string

    public constructor(path: string, name: string, config: NodeJS.ProcessEnv) {
        this.online = false
        this.name = name
        this.path = path
        this.fails = 0
        this.config = config
        this.startProcess()
    }

    public startProcess(): void {
        this.process = fork(this.path, {
            env: this.config
        })
        this.process.on('close', () => {
            this.fails++
            setTimeout(() => this.fails--, 300000)
            this.process.removeAllListeners('error')
            this.online = false
            if (this.fails > 4) {
                setTimeout(() => this.startProcess(), 120000)
                return
            }
            this.startProcess()
        })
        this.process.on('message', arg => {
            if (arg !== 'ready') {
                return
            }
            this.process.removeAllListeners('message')
            this.start()
        })
        this.process.on('unhandledRejection', (error: Error) => {
            if (error.name === 'FetchError') {
                process.exit()
            }
            if (error.message !== 'Unknown interaction' && error.message !== 'Status code: 403') {
                const date = new Date()
                writeFileSync(`${process.env.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-${this.name}.txt`, `${error.name}\n${error.message}\n${error.stack}`)
                process.exit()
            }
        })
    }

    public getOnline(): boolean {
        return this.online
    }

    public stop(): boolean {
        if (!this.online) {
            return false
        }
        this.process.send('stop')
        this.process.on('message', arg => {
            if (arg !== 'stop') {
                return
            }
            this.process.removeAllListeners('message')
            this.process.removeAllListeners('close')
            this.online = false
        })
        return true
    }

    public start(): boolean {
        if (this.online) {
            return false
        }
        if (!this.process.channel) {
            this.startProcess()
            return true
        }
        this.process.send('start')
        this.process.on('message', arg => {
            if (arg !== 'start') {
                return
            }
            this.process.removeAllListeners('message')
            this.online = true
        })
        return true
    }

    public deploy(): void {
        this.process.send('deploy')
    }
}