import { Message } from 'discord.js'
import { writeFileSync } from 'fs'
import { BaseCommand } from '../../../core/BaseCommand'
import { refreshData, userData, home } from '../../../core/common'
import { Deck } from '../../../core/modules/Deck'

async function addDeck(message: Message): Promise<string> {
    if (message.content.split(' ').length < 2) {
        return 'Please enter a deckstats URL!'
    }
    const deck = new Deck()
    if (!await deck.getInfo(message.content.split(' ')[1])) {
        return 'Something went wrong... (Make sure you are using a valid deck url from deckstats.net and that the deck is not a duplicate)'
    }
    refreshData()
    userData.decks.push(deck)
    const jsonString = JSON.stringify(userData)
    writeFileSync(`${home}/sys_files/bots.json`, jsonString)
    return 'Success!'
}

module.exports = new BaseCommand([ 'adddeck', 'add' ], addDeck)