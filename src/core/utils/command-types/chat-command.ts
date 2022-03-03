import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BotInfo } from '../interfaces.js'
import { BaseCommand } from './base-command.js'
import { GuildChatCommand } from './guild-chat-command.js'

type ResponseFunction = (interaction: CommandInteraction, info: BotInfo) => Promise<InteractionReplyOptions> | InteractionReplyOptions
type AutocompleteFunction = (option: ApplicationCommandOptionChoice, info: BotInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]

export class ChatCommand extends BaseCommand {

    public readonly respond: ResponseFunction
    public readonly autocomplete?: AutocompleteFunction
    public readonly ephemeral?: boolean

    public constructor(data: ApplicationCommandData, options: { respond: ResponseFunction, autocomplete?: AutocompleteFunction, ephemeral?: boolean }) {
        super(data)
        this.respond = options.respond
        this.autocomplete = options.autocomplete
        this.ephemeral = options.ephemeral
    }

    public isChatCommand(): this is ChatCommand {
        return true
    }

    public isGuildOnly(): this is GuildChatCommand {
        return false
    }
}