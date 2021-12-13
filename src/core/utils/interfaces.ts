/* eslint-disable camelcase */

import { DatabaseManager } from '../DatabaseManager'
import { BaseGame } from './BaseGame'
import { QueueManager } from '../voice/QueueManager'
import { VoiceManager } from '../voice/VoiceManager'

export interface GuildInfo {
    readonly database?: DatabaseManager
    readonly voiceManager?: VoiceManager
    readonly queueManager?: QueueManager
    readonly games: Map<string, BaseGame>
}