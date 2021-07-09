import { ChildProcess, fork } from 'child_process'

export class BotSubprocess {
    private readonly process: ChildProcess
    private online: boolean
    public readonly name: string
    private readonly id: string
    public static bots =  new Map<string, BotSubprocess>([
        ['potato', new BotSubprocess('./src/bots/potato/potato.js', 'Potato Bot', 'potato')],
        ['krenko', new BotSubprocess('./src/bots/krenko.js', 'Krenko Bot', 'krenko')],
        ['swear', new BotSubprocess('./src/bots/swear.js', 'Swear Bot', 'swear')],
        ['yeet', new BotSubprocess('./src/bots/yeet.js', 'Yeet Bot', 'yeet')]
    ]) 

    private constructor(path: string, name: string, id: string) {
        this.process = fork(path)
        this.online = false
        this.name = name
        this.id = id
        this.process.once('message', function (arg) {
            if (arg !== 'ready') {
                return
            }
            BotSubprocess.bots.get(id).start()
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
            BotSubprocess.bots.get(id).online = false
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
            BotSubprocess.bots.get(id).online = true
        })
        return true
    }
}