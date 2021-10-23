import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Deck } from '../../../core/modules/Deck'
import { GuildInfo } from '../../../core/utils/interfaces'

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

async function addDeck(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
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

module.exports = { data: data, execute: addDeck }