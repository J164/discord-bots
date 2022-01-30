import { ApplicationCommandData } from 'discord.js'
import { ChatCommand } from './chat-command.js'

export abstract class BaseCommand {

    public readonly data: ApplicationCommandData

    public constructor(data: ApplicationCommandData) {
        this.data = data
    }

    public isChatCommand(): this is ChatCommand {
        return false
    }
}