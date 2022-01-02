import { ApplicationCommandData, ButtonInteraction, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { request } from 'undici'

interface MagicCard {
    readonly name: string,
    readonly uri: string,
    readonly image_uris?: {
        readonly large: string
    }
    readonly card_faces?: readonly {
        readonly image_uris: {
            readonly large: string
        }
    }[]
    readonly prices: {
        readonly usd: string
    }
}

interface ScryfallResponse {
    readonly status?: string
    readonly data: MagicCard[]
}

const data: ApplicationCommandData = {
    name: 'decks',
    description: 'Get a deck from Potato\'s database'
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
    const decklist = <string> (await (await request(`${url}list`)).body.json()).list
    const decklistArray = decklist.split('\n')
    for (let index = 0; index < decklistArray.length; index++) {
        if (!decklistArray[index] || decklistArray[index].startsWith('//')) {
            decklistArray.splice(index, 1)
            index--
            continue
        }
        if (decklistArray[index].includes('//')) {
            decklistArray[index] = decklistArray[index].slice(0, decklistArray[index].indexOf('//'))
        }
        if (decklistArray[index].includes('#')) {
            decklistArray[index] = decklistArray[index].slice(0, decklistArray[index].indexOf('#'))
        }
    }
    return '\n' + decklistArray.join('\n')
}

async function parseDeck(interaction: CommandInteraction, info: GuildInfo, urls: { url: string }[], button?: ButtonInteraction, index = 0): Promise<void> {
    const url = urls[index].url
    const fields = url.split('/')
    const authorID = fields[4]
    const deckID = fields[5].split('-')[0]
    const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${authorID}&id=${deckID}&response_type=`
    const results = <DeckstatsResponse> await (await request(`${apiUrl}json`)).body.json()
    let image: string
    for (const section of results.sections) {
        const commander = section.cards.findIndex(card => card.isCommander)
        if (commander !== -1) {
            const cardInfo = <ScryfallResponse> await (await request(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(section.cards[commander].name)}`)).body.json()
            image = cardInfo.data[0].image_uris.large
        }
    }
    const options: InteractionReplyOptions = { embeds: [ generateEmbed('info', { title: results.name, image: { url: image }, fields: [ { name: 'Deckstats URL:', value: url } ], footer: { text: `${index + 1}/${urls.length}` } }) ], components: [ { components: [
        { type: 'BUTTON', customId: 'decks-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: index === 0 },
        { type: 'BUTTON', customId: 'decks-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: index === 0 },
        { type: 'BUTTON', customId: 'decks-list', emoji: '\uD83D\uDCC4', label: 'Decklist', style: 'PRIMARY' },
        { type: 'BUTTON', customId: 'decks-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: index === urls.length - 1 },
        { type: 'BUTTON', customId: 'decks-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: index === urls.length - 1 }
    ], type: 'ACTION_ROW' } ] }
    await (!button ? interaction.editReply(options) : button.update(options))
    const filter = (b: ButtonInteraction<'cached'>) => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
    const collector = interaction.channel.createMessageComponentCollector({ filter: filter, time: 60_000 })
    collector.once('collect', async b => {
        if (!b.isButton()) return
        switch (b.customId) {
            case 'decks-doublearrowleft':
                parseDeck(interaction, info, urls, b)
                break
            case 'decks-arrowleft':
                parseDeck(interaction, info, urls, b, index - 1)
                break
            case 'decks-list':
                b.update({ content: await getList(apiUrl), embeds: [], components: [] }).catch(() => b.update({ embeds: [ generateEmbed('error', { title: 'There seems to be something wrong with the Deckstats API at the moment. Try again later' }) ], components: [] }))
                break
            case 'decks-arrowright':
                parseDeck(interaction, info, urls, b, index + 1)
                break
            case 'decks-doublearrowright':
                parseDeck(interaction, info, urls, b, urls.length - 1)
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

async function getDeck(interaction: CommandInteraction, info: GuildInfo): Promise<void> {
    parseDeck(interaction, info, <{ url: string }[]> <unknown> await info.database.select('mtg_decks'))
}

export const command: Command = { data: data, execute: getDeck, ephemeral: true }