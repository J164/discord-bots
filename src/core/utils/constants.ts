import { readFileSync } from 'fs'
import { BotConfig } from './interfaces'

export const config = <BotConfig> JSON.parse(readFileSync('./../assets/data/config.json', { encoding: 'utf8' }))