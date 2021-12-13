import { ThreadChannel } from 'discord.js'

export abstract class BaseGame {

    protected readonly gameChannel: ThreadChannel
    protected over: boolean

    public constructor (gameChannel: ThreadChannel) {
        this.gameChannel = gameChannel
        this.over = false
    }

    public getThreadName(): string {
        return this.gameChannel.name
    }

    protected end(): void {
        setTimeout(() => { try { this.gameChannel.setArchived(true) } catch { /*thread deleted*/ } }, 10000)
        this.over = true
    }

    public isOver(): boolean {
        return this.over
    }
}