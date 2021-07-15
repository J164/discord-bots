import { Message } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { Deck } from '../../../core/modules/Deck'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

async function addDeck(message: Message, info: KrenkoGuildInputManager): Promise<string> {
    if (message.content.split(' ').length < 2) {
        return 'Please enter a deckstats URL!'
    }
    const deck = new Deck()
    if (!await deck.getInfo(message.content.split(' ')[1])) {
        return 'Something went wrong... (Make sure you are using a valid deck url from deckstats.net)'
    }
    try {
        info.database.insert('decks', new Map<string, string>([
            [ 'name', deck.getName() ],
            [ 'image', deck.getImage() ],
            [ 'url', deck.getUrl() ],
            [ 'api_url', deck.getApiUrl() ]
        ]))
    } catch {
        return 'Failed! (Make sure the deck isn\'t a duplicate)'
    }
    return 'Success!'
}

module.exports = new BaseCommand([ 'adddeck', 'add' ], addDeck)