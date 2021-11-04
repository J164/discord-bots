/* eslint-disable camelcase */

import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions, User } from 'discord.js'
import { DatabaseManager } from '../DatabaseManager'
import { BaseMagicGame } from '../modules/games/BaseMagicGame'
import { QueueManager } from '../voice/QueueManager'
import { VoiceManager } from '../voice/VoiceManager'

export interface GuildInfo {
    readonly database?: DatabaseManager
    readonly voiceManager?: VoiceManager
    readonly queueManager?: QueueManager
    game?: BaseMagicGame
}

export interface Command {
    readonly data: ApplicationCommandData
    readonly execute: (interaction: CommandInteraction, info: GuildInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void
    readonly autocomplete?: (name: string, value: string | number, info: GuildInfo) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[]
}

export interface YoutubeResponse {
    data: {
        pageInfo: {
            totalResults: number
        },
        items: {
            id: {
                videoId: string
            },
            snippet: {
                title: string
            }
        }[]
    }
}

export interface HolidayResponse {
    readonly data: readonly {
        readonly name: string,
        readonly description: string
    }[]
}

export interface WeatherResponse {
    readonly data: {
        readonly current: {
            readonly temp_f: number,
            readonly condition: {
                readonly text: string,
                readonly code: number
            },
            readonly wind_mph: number,
            readonly feelslike_f: number
        }
    }
}

export interface QuoteResponse {
    readonly data: {
        readonly contents: {
            readonly quotes: readonly {
                readonly quote: string,
                readonly author: string
            }[]
        }
    }
}

export interface SwearSongInfo {
    readonly index: number,
    readonly name: string
}

export interface DeckInfo {
    readonly name: string,
    readonly image: string,
    readonly url: string,
    readonly api_url: string
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

export interface WynncraftData {
    readonly data: readonly {
        readonly username: string,
        readonly meta: {
            readonly location: {
                readonly online: boolean
                readonly server: string
            }
        }
        readonly classes: readonly {
            readonly name: string
            readonly playtime: number
            readonly professions: {
                readonly combat: {
                    readonly level: number
                }
            }
        }[]
    }[]
}

export interface TenorResponse {
    readonly results: readonly {
        readonly itemurl: string
    }[]
}

export interface DeckJson {
    readonly image: string;
    readonly name: string;
    readonly url: string;
    readonly api_url: string;
}

export interface DeckstatsResponse {
    readonly name: string
    readonly sections: readonly {
        readonly cards: readonly {
            readonly name: string
            readonly isCommander: boolean
        }[]
    }[]
}

export interface DeckstatsListResponse {
    readonly list: string
}

export interface MagicPlayer {
    readonly name: string,
    life: number,
    poison: number,
    isAlive: boolean,
    commanderDamage?: Map<string, number>
}

export interface EuchreTeam {
    tricks: number;
    score: number;
}

export interface Card {
    readonly code: string;
    readonly suit: string;
    readonly value: string;
}

export interface EuchrePlayer {
    readonly id: number;
    readonly user: User;
    hand: Card[];
    readonly team: EuchreTeam;
}