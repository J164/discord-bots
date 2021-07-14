import { ChildProcess, fork } from 'child_process'

export class BotSubprocess {
    private readonly process: ChildProcess
    private online: boolean
    public readonly name: string
    private readonly id: string

    public constructor(path: string, name: string, id: string) {
        this.process = fork(path)
        this.online = false
        this.name = name
        this.id = id
        this.process.once('message', arg => {
            if (arg !== 'ready') {
                return
            }
            this.start()
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
        this.process.once('message', arg => {
            if (arg !== 'stop') {
                return
            }
            this.online = false
        })
        return true
    }

    public start(): boolean {
        if (this.online) {
            return false
        }
        this.process.send('start')
        this.process.once('message', arg => {
            if (arg !== 'start') {
                return
            }
            this.online = true
        })
        return true
    }
}