import { DatabaseManager } from '../DatabaseManager.js'
import { BaseGame } from './BaseGame.js'
import { QueueManager } from '../voice/QueueManager.js'
import { VoiceManager } from '../voice/VoiceManager.js'
import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, ApplicationCommandOptionChoice } from 'discord.js'

export interface GuildInfo {
    readonly database?: DatabaseManager
    readonly voiceManager?: VoiceManager
    readonly queueManager?: QueueManager
    readonly games: Map<string, BaseGame>
}

export interface Command {
    readonly data: ApplicationCommandData
    readonly execute: (interaction: CommandInteraction, info: GuildInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void
    readonly autocomplete?: (option: ApplicationCommandOptionChoice, info: GuildInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]
    readonly gameCommand?: boolean
}