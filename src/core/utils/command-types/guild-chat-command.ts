import { CommandInteraction, InteractionReplyOptions, ApplicationCommandOptionChoice, ApplicationCommandData } from 'discord.js'
import { Info } from '../interfaces.js'
import { ChatCommand } from './chat-command.js'

type ResponseFunction = (interaction: CommandInteraction, info: Info) => Promise<InteractionReplyOptions> | InteractionReplyOptions
type AutocompleteFunction = (option: ApplicationCommandOptionChoice, info: Info) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]

export class GuildChatCommand extends ChatCommand {

    public readonly respond: ResponseFunction
    public readonly autocomplete?: AutocompleteFunction
    public readonly channelType?: never //TODO implement in v14

    public constructor(data: ApplicationCommandData, options: { respond: ResponseFunction, autocomplete?: AutocompleteFunction, ephemeral?: boolean, channelType?: never }) {
        super(data, options)
        this.channelType = options.channelType
    }

    public isGuildOnly(): this is GuildChatCommand {
        return true
    }
}