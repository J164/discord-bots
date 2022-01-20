import { DatabaseManager } from '../database-manager.js'
import { QueueManager } from '../voice/queue-manager.js'
import { VoiceManager } from '../voice/voice-manager.js'
import { BaseGame } from './base-game.js'

export type GameType = 'MAGICGAME'

export type Info = BotInfo & GuildInfo

export interface BotInfo {
    readonly database: DatabaseManager
}

export interface GuildInfo {
    readonly voiceManager: VoiceManager
    readonly queueManager: QueueManager
    readonly games: Map<string, BaseGame>
}