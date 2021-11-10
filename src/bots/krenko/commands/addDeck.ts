import axios from 'axios'
import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../../core/utils/commonFunctions'
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
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong (Make sure you are using a deckstats url' }) ] }
    }
    try {
        info.database.insert('mtg_decks', new Map<string, string>([
            [ 'url', interaction.options.getString('url') ]
        ]))
    } catch {
        return { embeds: [ generateEmbed('error', { title: 'Failed! (Make sure the deck isn\'t a duplicate)' }) ] }
    }
    return { embeds: [ generateEmbed('success', { title: `Success! Deck "${name}" has been added!` }) ] }
}

module.exports = { data: data, execute: addDeck }