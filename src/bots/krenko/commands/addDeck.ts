import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { GuildInputManager } from '../../../core/GuildInputManager'
import { Deck } from '../../../core/modules/Deck'

const data: ApplicationCommandData = {
    name: 'adddeck',
    description: 'Add a deck to Krenko\'s database',
    options: [ {
        name: 'url',
        description: 'Deckstats URL for the new deck',
        type: 'STRING',
        required: true
    } ]
}

async function addDeck(interaction: CommandInteraction, info: GuildInputManager): Promise<InteractionReplyOptions> {
    const deck = new Deck()
    if (!await deck.getInfo(<string> interaction.options.getString('url'))) {
        return { content: 'Something went wrong... (Make sure you are using a valid deck url from deckstats.net)' }
    }
    try {
        info.database.insert('decks', new Map<string, string>([
            [ 'name', deck.getName() ],
            [ 'image', deck.getImage() ],
            [ 'url', deck.getUrl() ],
            [ 'api_url', deck.getApiUrl() ]
        ]))
    } catch {
        return { content: 'Failed! (Make sure the deck isn\'t a duplicate)' }
    }
    return { content: 'Success!' }
}

module.exports = new BaseCommand(data, addDeck)