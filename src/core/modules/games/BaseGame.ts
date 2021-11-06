import { ThreadChannel } from 'discord.js'

export abstract class BaseGame {

    private gameChannel: ThreadChannel
    protected over: boolean

    public constructor (gameChannel: ThreadChannel) {
        this.gameChannel = gameChannel
        this.over = false
    }

    public getThreadName(): string {
        return this.gameChannel.name
    }

    protected async end(): Promise<void> {
        setTimeout(() => { try { this.gameChannel.setArchived(true) } catch { /*thread deleted*/ } }, 10000)
        this.over = true
    }

    public isOver(): boolean {
        return this.over
    }
}