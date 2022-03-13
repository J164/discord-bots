import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, ApplicationCommandOptionChoice } from 'discord.js'
import { DatabaseManager } from '../database-manager.js'
import { QueueManager } from '../voice/queue-manager.js'
import { VoiceManager } from '../voice/voice-manager.js'

export interface GuildInfo {
    readonly voiceManager: VoiceManager
    readonly queueManager: QueueManager
}

interface GlobalInfo {
    readonly database: DatabaseManager
}

export type GlobalChatCommandInfo = GlobalInfo & { readonly interaction: CommandInteraction }
export type GlobalAutocompleteInfo = GlobalInfo & { readonly option: ApplicationCommandOptionChoice }

export type GuildChatCommandInfo = GuildInfo & GlobalChatCommandInfo
export type GuildAutocompleteInfo = GuildInfo & GlobalAutocompleteInfo

abstract class BaseCommand {

    public readonly data: ApplicationCommandData

    public constructor(data: ApplicationCommandData) {
        this.data = data
    }
}

type GlobalResponseFunction = (info: GlobalChatCommandInfo) => Promise<InteractionReplyOptions> | InteractionReplyOptions
type GlobalAutocompleteFunction = (info: GlobalAutocompleteInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]

export class GlobalChatCommand extends BaseCommand {

    public readonly respond: GlobalResponseFunction
    public readonly autocomplete?: GlobalAutocompleteFunction
    public readonly ephemeral?: boolean

    public constructor(data: ApplicationCommandData, options: { respond: GlobalResponseFunction, autocomplete?: GlobalAutocompleteFunction, ephemeral?: boolean }) {
        super(data)

        this.respond = options.respond
        this.autocomplete = options.autocomplete
        this.ephemeral = options.ephemeral
    }

    public isGuildChatCommand(): this is GuildChatCommand {
        return false
    }
}

type GuildResponseFunction = (info: GuildChatCommandInfo) => Promise<InteractionReplyOptions> | InteractionReplyOptions
type GuildAutocompleteFunction = (info: GuildAutocompleteInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]

export class GuildChatCommand extends GlobalChatCommand {

    public readonly respond: GuildResponseFunction
    public readonly autocomplete?: GuildAutocompleteFunction
    public readonly channelType?: never //TODO implement in v14

    public constructor(data: ApplicationCommandData, options: { respond: GuildResponseFunction, autocomplete?: GuildAutocompleteFunction, ephemeral?: boolean, channelType?: never }) {
        super(data, options)

        this.channelType = options.channelType
    }

    public isGuildChatCommand(): this is GuildChatCommand {
        return true
    }
}