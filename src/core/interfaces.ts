/* eslint-disable camelcase */

import { User } from 'discord.js'

export interface BotConfig {
    potatoKey: string,
    swearKey: string,
    krenkoKey: string,
    yeetKey: string,
    googleKey: string,
    tenorKey: string,
    sqlPass: string,
    data: string,
    potatoStatus: string[],
    swearStatus: string[],
    krenkoStatus: string[],
    yeetStatus: string[],
    blacklist: {
        swears: string[],
        insults: string[]
    }
}

export interface SwearSongInfo {
    index: number,
    name: string
}

export interface DeckInfo {
    name: string,
    image: string,
    url: string,
    api_url: string
}

export interface MagicCard {
    name: string,
    uri: string,
    image_uris?: {
        large: string
    }
    card_faces?: {
        image_uris: {
            large: string
        }
    }[]
    prices: {
        usd: string
    }
}

export interface ScryfallResponse {
    status?: string
    data: MagicCard[]
}

export interface WynncraftData {
    data: {
        username: string,
        meta: {
            location: {
                online: boolean
                server: string
            }
        }
        classes: {
            name: string
            playtime: number
            professions: {
                combat: {
                    level: number
                }
            }
        }[]
    }[]
}

export interface TenorResponse {
    results: {
        itemurl: string
    }[]
}

export interface DeckJson {
    image: string;
    name: string;
    url: string;
    api_url: string;
}

export interface DeckstatsResponse {
    name: string
    sections: {
        cards: {
            name: string
            isCommander: boolean
        }[]
    }[]
}

export interface DeckstatsListResponse {
    list: string
}

export interface MagicPlayer {
    name: string,
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
    code: string;
    suit: string;
    value: string;
}

export interface EuchrePlayer {
    id: number;
    user: User;
    hand: Card[];
    team: EuchreTeam;
}