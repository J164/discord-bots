import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js'
import { readFileSync } from 'fs'

const data: ApplicationCommandData = {
    name: 'quote',
    description: 'Potato Bot will say a random funny quote'
}

function quote(): InteractionReplyOptions {
    const quotes = readFileSync('./assets/data/quotes.txt', 'utf8').split('}')
    return { content: quotes[Math.floor(Math.random() * quotes.length)], tts: true }
}

module.exports = { data: data, execute: quote }