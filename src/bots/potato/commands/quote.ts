import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js'
import { readFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { root } from '../../../core/common'

const data: ApplicationCommandData = {
    name: 'quote',
    description: 'Potato Bot will say a random funny quote'
}

function quote(): InteractionReplyOptions {
    const quotes = readFileSync(`${root}/assets/static/quotes.txt`, 'utf8').split('}')
    return { content: quotes[Math.floor(Math.random() * quotes.length)], tts: true }
}

module.exports = new BaseCommand(data, quote)