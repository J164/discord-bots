import { DatabaseManager } from '../database-manager.js'
import { QueueManager } from '../voice/queue-manager.js'
import { VoiceManager } from '../voice/voice-manager.js'
import { CommandInteraction, InteractionReplyOptions, ApplicationCommandOptionChoice, ApplicationCommandData } from 'discord.js'
import { Euchre } from '../modules/games/euchre-game.js'
import { MagicGame } from '../modules/games/magic-game.js'
//import { Blackjack } from '../modules/games/blackjack.js'

export type GameType = 'EUCHRE' | 'MAGICGAME'// | 'BLACKJACK'
export type Game = Euchre | MagicGame// | Blackjack

export interface GuildInfo {
    readonly database?: DatabaseManager
    readonly voiceManager?: VoiceManager
    readonly queueManager?: QueueManager
    readonly games: Map<string, Game>
}

export interface Command {
    readonly data: ApplicationCommandData
    readonly execute: (interaction: CommandInteraction, info: GuildInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void
    readonly autocomplete?: (option: ApplicationCommandOptionChoice, info: GuildInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]
    readonly gameCommand?: GameType
    readonly ephemeral?: boolean
}