import { ThreadChannel } from 'discord.js'
import { setTimeout } from 'node:timers'
import { GameType } from './interfaces.js'

export abstract class BaseGame {

    protected readonly _gameChannel: ThreadChannel
    protected _over: boolean
    public abstract readonly type: GameType

    public constructor (gameChannel: ThreadChannel) {
        this._gameChannel = gameChannel
        this._over = false
    }

    public get channelName(): string {
        return this._gameChannel.name
    }

    public get over(): boolean {
        return this._over
    }

    public end(): void {
        setTimeout(() => { try { void this._gameChannel.setArchived(true) } catch { /*thread deleted*/ } }, 10_000)
        this._over = true
    }
}