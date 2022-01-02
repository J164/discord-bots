import { DatabaseManager } from '../database-manager.js'
import { BaseGame } from './base-game.js'
import { QueueManager } from '../voice/queue-manager.js'
import { VoiceManager } from '../voice/voice-manager.js'
import { CommandInteraction, InteractionReplyOptions, ApplicationCommandOptionChoice, ApplicationCommandDataResolvable } from 'discord.js'

export interface GuildInfo {
    readonly database?: DatabaseManager
    readonly voiceManager?: VoiceManager
    readonly queueManager?: QueueManager
    readonly games: Map<string, BaseGame>
}

export interface Command {
    readonly data: ApplicationCommandDataResolvable
    readonly execute: (interaction: CommandInteraction, info: GuildInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void
    readonly autocomplete?: (option: ApplicationCommandOptionChoice, info: GuildInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]
    readonly gameCommand?: boolean
    readonly ephemeral?: boolean
}