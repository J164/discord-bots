import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInputManager } from './GuildInputManager'

export class BaseCommand {

    public readonly data: ApplicationCommandData
    public readonly execute: (interaction: CommandInteraction, info: GuildInputManager) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void

    public constructor(data: ApplicationCommandData, execute: (interaction: CommandInteraction, info: GuildInputManager) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void) {
        this.data = data
        this.execute = execute
    }
}