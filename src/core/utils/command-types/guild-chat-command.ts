import { CommandInteraction, InteractionReplyOptions, ApplicationCommandOptionChoice, ApplicationCommandData } from 'discord.js'
import { GameType, Info } from '../interfaces.js'
import { ChatCommand } from './chat-command.js'

type ResponseFunction = (interaction: CommandInteraction, info: Info) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void
type AutocompleteFunction = (option: ApplicationCommandOptionChoice, info: Info) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]

export class GuildChatCommand extends ChatCommand {

    public readonly respond: ResponseFunction
    public readonly autocomplete?: AutocompleteFunction
    public readonly gameCommand?: GameType

    public constructor(data: ApplicationCommandData, options: { respond: ResponseFunction, autocomplete?: AutocompleteFunction, ephemeral?: boolean, gameCommand?: GameType }) {
        super(data, options)
        this.gameCommand = options.gameCommand
    }

    public isGuildOnly(): this is GuildChatCommand {
        return true
    }
}