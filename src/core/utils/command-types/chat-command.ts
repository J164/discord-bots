import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BotInfo } from '../interfaces.js'
import { BaseCommand } from './base-command.js'
import { GuildChatCommand } from './guild-chat-command.js'

type ResponseFunction = (interaction: CommandInteraction, info: BotInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void
type AutocompleteFunction = (option: ApplicationCommandOptionChoice, info: BotInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]

export class ChatCommand extends BaseCommand {

    protected readonly _respond: ResponseFunction
    protected readonly _autocomplete?: AutocompleteFunction
    private readonly _ephemeral?: boolean

    public constructor(data: ApplicationCommandData, options: { respond: ResponseFunction, autocomplete?: AutocompleteFunction, ephemeral?: boolean }) {
        super(data)
        this._respond = options.respond
        this._autocomplete = options.autocomplete
        this._ephemeral = options.ephemeral
    }

    public get respond(): ResponseFunction {
        return this._respond
    }

    public get autocomplete(): AutocompleteFunction {
        return this._autocomplete
    }

    public get ephemeral(): boolean {
        return this._ephemeral
    }

    public isSlashCommand(): this is ChatCommand {
        return false
    }

    public isGuildOnly(): this is GuildChatCommand {
        return false
    }
}