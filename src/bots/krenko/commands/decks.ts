import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, InteractionReplyOptions, MessageActionRow, MessageButton } from 'discord.js'
import { GuildInfo, ScryfallResponse } from '../../../core/utils/interfaces'
import { generateEmbed } from '../../../core/utils/commonFunctions'
import axios from 'axios'

const data: ApplicationCommandData = {
    name: 'decks',
    description: 'Get a deck from Krenko\'s database'
}

interface DeckstatsResponse {
    readonly name: string
    readonly sections: readonly {
        readonly cards: readonly {
            readonly name: string
            readonly isCommander: boolean
        }[]
    }[]
}

async function getList(url: string): Promise<string> {
    const decklist = <string> (await axios.get(`${url}list`)).data.list
    const decklistArray = decklist.split('\n')
    for (let i = 0; i < decklistArray.length; i++) {
        if (!decklistArray[i] || decklistArray[i].startsWith('//')) {
            decklistArray.splice(i, 1)
            i--
            continue
        }
        if (decklistArray[i].indexOf('//') !== -1) {
            decklistArray[i] = decklistArray[i].substr(0, decklistArray[i].indexOf('//'))
        }
        if (decklistArray[i].indexOf('#') !== -1) {
            decklistArray[i] = decklistArray[i].substr(0, decklistArray[i].indexOf('#'))
        }
    }
    return '\n' + decklistArray.join('\n')
}

async function parseDeck(interaction: CommandInteraction, info: GuildInfo, urls: { url: string }[], button: ButtonInteraction = null, i = 0): Promise<void> {
    const url = urls[i].url
    const fields = url.split('/')
    const authorID = fields[4]
    const deckID = fields[5].split('-')[0]
    const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${authorID}&id=${deckID}&response_type=`
    const results = <DeckstatsResponse> (await axios.get(`${apiUrl}json`)).data
    const components = [ new MessageButton({ customId: 'decks-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'decks-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'decks-list', emoji: '\uD83D\uDCC4', label: 'Decklist', style: 'PRIMARY' }),
                         new MessageButton({ customId: 'decks-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'decks-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY' }) ]
    if (i === 0) {
        components[0].setDisabled(true)
        components[1].setDisabled(true)
    }
    if (i === urls.length - 1) {
        components[3].setDisabled(true)
        components[4].setDisabled(true)
    }
    const row1 = new MessageActionRow().addComponents(components)
    let image: string
    for (const section of results.sections) {
        const commander = section.cards.findIndex(card => card.isCommander)
        if (commander !== -1) {
            const cardInfo = <ScryfallResponse> (await axios.get(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(section.cards[commander].name)}`)).data
            image = cardInfo.data[0].image_uris.large
        }
    }
    const options: InteractionReplyOptions = { embeds: [ generateEmbed('info', { title: results.name, image: { url: image }, fields: [ { name: 'Deckstats URL:', value: url } ], footer: { text: `${i + 1}/${urls.length}` } }) ], components: [ row1 ] }
    if (!button) {
        await interaction.editReply(options)
    } else {
        await button.update(options)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: CollectorFilter<[any]> = b => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
    const collector = <InteractionCollector<ButtonInteraction>> interaction.channel.createMessageComponentCollector({ filter: filter, time: 60000 })
    collector.once('collect', async b => {
        switch (b.customId) {
            case 'decks-doublearrowleft':
                parseDeck(interaction, info, urls, b)
                break
            case 'decks-arrowleft':
                parseDeck(interaction, info, urls, b, i - 1)
                break
            case 'decks-list':
                try {
                    b.update({ content: await getList(apiUrl), embeds: [], components: [] })
                } catch {
                    b.update({ embeds: [ generateEmbed('error', { title: 'There seems to be something wrong with the Deckstats API at the moment. Try again later' }) ], components: [] })
                }
                break
            case 'decks-arrowright':
                parseDeck(interaction, info, urls, b, i + 1)
                break
            case 'decks-doublearrowright':
                parseDeck(interaction, info, urls, b, urls.length - 1)
                break
            default:
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

function getDeck(interaction: CommandInteraction, info: GuildInfo): void {
    info.database.select('mtg_decks', results => {
        parseDeck(interaction, info, <{ url: string }[]> results)
    })
}

module.exports = { data: data, execute: getDeck }