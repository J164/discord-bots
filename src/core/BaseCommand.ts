import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from './utils/interfaces'

export class BaseCommand {

    public readonly data: ApplicationCommandData
    public readonly execute: (interaction: CommandInteraction, info: GuildInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void

    public constructor(data: ApplicationCommandData, execute: (interaction: CommandInteraction, info: GuildInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void) {
        this.data = data
        this.execute = execute
    }
}