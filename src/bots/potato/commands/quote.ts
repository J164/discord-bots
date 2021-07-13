import { readFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { root } from '../../../core/common'

function getQuotes(): string {
    const quotes = readFileSync(`${root}/assets/static/quotes.txt`, 'utf8').split('}')
    return quotes[Math.floor(Math.random() * quotes.length)]
}

module.exports = new BaseCommand([ 'quotes', 'quote' ], getQuotes)