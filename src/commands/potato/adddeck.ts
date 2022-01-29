import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'
import { generateEmbed } from '../../core/utils/generators.js'
import { BotInfo } from '../../core/utils/interfaces.js'
import process from 'node:process'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'

async function addDeck(interaction: CommandInteraction, info: BotInfo): Promise<InteractionReplyOptions> {
    if (interaction.user.id !== process.env.ADMIN && interaction.user.id !== process.env.SWEAR && interaction.user.id !== process.env.MAGIC) {
        return { embeds: [ generateEmbed('error', { title: 'You don\'t have permission to use this command!' }) ] }
    }
    const decks = await info.database.select('mtg_decks') as unknown as { url: string }[]
    if (decks.some(a => a.url === interaction.options.getString('url'))) {
        return { embeds: [ generateEmbed('error', { title: 'Failed! (Make sure the deck isn\'t a duplicate)' }) ] }
    }

    let apiUrl: string
    let name: string
    try {
        const fields = interaction.options.getString('url').split('/')
        const authorID = fields[4]
        const deckID = fields[5].split('-')[0]
        apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${authorID}&id=${deckID}&response_type=`
        name = (await (await request(`${apiUrl}json`)).body.json() as { name: string }).name
    } catch {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong (Make sure you are using a deckstats url' }) ] }
    }
    await info.database.insert('mtg_decks', { url: interaction.options.getString('url') })
    return { embeds: [ generateEmbed('success', { title: `Success! Deck "${name}" has been added!` }) ] }
}

export const command = new ChatCommand({
    name: 'adddeck',
    description: 'Add a deck to Potato\'s database',
    options: [ {
        name: 'url',
        description: 'Deckstats URL for the new deck',
        type: 'STRING',
        required: true,
    } ],
}, { respond: addDeck })
