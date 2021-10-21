import { Snowflake } from 'discord.js'
import { readFileSync } from 'fs'

interface BotConfig {
    admin: Snowflake,
    swear: Snowflake,
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

interface Secrets {
    potatoKey: string,
    swearKey: string,
    krenkoKey: string,
    yeetKey: string,
    googleKey: string,
    tenorKey: string,
    abstractKey: string,
    weatherKey: string,
    sqlPass: string
}

export const config = <BotConfig> JSON.parse(readFileSync('./../assets/data/config.json', { encoding: 'utf8' }))
export const secrets = <Secrets> JSON.parse(readFileSync('./../assets/data/secrets.json', { encoding: 'utf-8' }))