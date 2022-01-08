import { ThreadChannel } from 'discord.js'
import { setTimeout } from 'node:timers'

export abstract class BaseGame {

    protected readonly gameChannel: ThreadChannel
    protected over: boolean

    public constructor (gameChannel: ThreadChannel) {
        this.gameChannel = gameChannel
        this.over = false
    }

    public get channelName(): string {
        return this.gameChannel.name
    }

    protected end(): void {
        setTimeout(() => { try { void this.gameChannel.setArchived(true) } catch { /*thread deleted*/ } }, 10_000)
        this.over = true
    }

    public isOver(): boolean {
        return this.over
    }
}