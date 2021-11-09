import axios from 'axios'
import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
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
    let apiUrl: string
    let name: string
    try {
        const fields = interaction.options.getString('url').split('/')
        const authorID = fields[4]
        const deckID = fields[5].split('-')[0]
        apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${authorID}&id=${deckID}&response_type=`
        name = (await axios.get(`${apiUrl}json`)).data.name
    } catch {
        return { content: 'Something went wrong (Make sure you are using a deckstats url' }
    }
    try {
        info.database.insert('mtg_decks', new Map<string, string>([
            [ 'url', interaction.options.getString('url') ]
        ]))
    } catch {
        return { content: 'Failed! (Make sure the deck isn\'t a duplicate)' }
    }
    return { content: `Success! Deck "${name}" has been added!` }
}

module.exports = { data: data, execute: addDeck }