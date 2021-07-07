import * as exec from 'child_process'

export class BotSubprocess {
    private readonly process: exec.ChildProcess
    private online: boolean
    public readonly name: string
    private readonly id: string
    public static bots: { [key: string]: BotSubprocess } = {
        potato: new BotSubprocess('./src/bots/potato.js', 'Potato Bot', 'potato'),
        krenko: new BotSubprocess('./src/bots/krenko.js', 'Krenko Bot', 'krenko'),
        swear: new BotSubprocess('./src/bots/swear.js', 'Swear Bot', 'swear'),
        yeet: new BotSubprocess('./src/bots/yeet.js', 'Yeet Bot', 'yeet'),
    }

    private constructor(path: string, name: string, id: string) {
        this.process = exec.fork(path)
        this.online = false
        this.name = name
        this.id = id
        this.process.once('message', function (arg) {
            if (arg !== 'ready') {
                return
            }
            BotSubprocess.bots[id].start()
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
        const id = this.id
        this.process.once('message', function (arg) {
            if (arg !== 'stop') {
                return
            }
            BotSubprocess.bots[id].online = false
        })
        return true
    }

    public start(): boolean {
        if (this.online) {
            return false
        }
        this.process.send('start')
        const id = this.id
        this.process.once('message', function (arg) {
            if (arg !== 'start') {
                return
            }
            BotSubprocess.bots[id].online = true
        })
        return true
    }
}