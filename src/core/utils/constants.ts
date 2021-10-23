import { Snowflake } from 'discord.js'
import { readFileSync } from 'fs'

interface BotConfig {
    readonly admin: Snowflake,
    readonly swear: Snowflake,
    readonly data: string,
    readonly potatoStatus: string[],
    readonly swearStatus: string[],
    readonly krenkoStatus: string[],
    readonly yeetStatus: string[],
    readonly blacklist: {
        readonly swears: string[],
        readonly insults: string[]
    }
}

interface Secrets {
    readonly potatoKey: string,
    readonly swearKey: string,
    readonly krenkoKey: string,
    readonly yeetKey: string,
    readonly googleKey: string,
    readonly tenorKey: string,
    readonly abstractKey: string,
    readonly weatherKey: string,
    readonly sqlPass: string
}

export const config = <BotConfig> JSON.parse(readFileSync('./../assets/data/config.json', { encoding: 'utf8' }))
export const secrets = <Secrets> JSON.parse(readFileSync('./../assets/data/secrets.json', { encoding: 'utf-8' }))