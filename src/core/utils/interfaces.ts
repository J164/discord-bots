/* eslint-disable camelcase */

import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions, Snowflake } from 'discord.js'
import { DatabaseManager } from '../DatabaseManager'
import { BaseGame } from '../modules/games/BaseGame'
import { QueueManager } from '../voice/QueueManager'
import { VoiceManager } from '../voice/VoiceManager'

export interface GuildInfo {
    readonly database?: DatabaseManager
    readonly voiceManager?: VoiceManager
    readonly queueManager?: QueueManager
    readonly games: Map<Snowflake, BaseGame>
}

export interface Command {
    readonly data: ApplicationCommandData
    readonly execute: (interaction: CommandInteraction, info: GuildInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void
    readonly autocomplete?: (option: ApplicationCommandOptionChoice, info: GuildInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]
    readonly gameCommand?: boolean
}

export interface SwearSongInfo {
    readonly index: number,
    readonly name: string
}

export interface MagicCard {
    readonly name: string,
    readonly uri: string,
    readonly image_uris?: {
        readonly large: string
    }
    readonly card_faces?: readonly {
        readonly image_uris: {
            readonly large: string
        }
    }[]
    readonly prices: {
        readonly usd: string
    }
}

export interface ScryfallResponse {
    readonly status?: string
    readonly data: MagicCard[]
}