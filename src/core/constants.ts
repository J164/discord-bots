import { readFileSync } from 'fs'
import { BotConfig } from './interfaces'

export const home = 'D:/Bot Resources'
export const root = './..'
export const config = <BotConfig> JSON.parse(readFileSync(`${root}/assets/data/config.json`, { encoding: 'utf8' }))