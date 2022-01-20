import { ApplicationCommandData } from 'discord.js'
import { ChatCommand } from './chat-command.js'

export abstract class BaseCommand {

    private readonly _data: ApplicationCommandData

    public constructor(data: ApplicationCommandData) {
        this._data = data
    }

    public get data(): ApplicationCommandData {
        return this._data
    }

    public isSlashCommand(): this is ChatCommand {
        return false
    }
}