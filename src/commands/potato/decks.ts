import { ButtonInteraction, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { BotInfo } from '../../core/utils/interfaces.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { request } from 'undici'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'

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
    const decklist = (await (await request(`${url}list`)).body.json() as { list: string }).list
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

async function parseDeck(interaction: CommandInteraction, urls: { url: string }[], button?: ButtonInteraction, index = 0): Promise<void> {
    const url = urls[index].url
    const fields = url.split('/')
    const authorID = fields[4]
    const deckID = fields[5].split('-')[0]
    const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${authorID}&id=${deckID}&response_type=`
    const results = await (await request(`${apiUrl}json`)).body.json() as DeckstatsResponse
    let image: string
    for (const section of results.sections) {
        const commander = section.cards.findIndex(card => card.isCommander)
        if (commander !== -1) {
            const cardInfo = await (await request(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(section.cards[commander].name)}`)).body.json() as ScryfallResponse
            image = cardInfo.data[0].image_uris.large
        }
    }
    const options: InteractionReplyOptions = { embeds: [ generateEmbed('info', { title: results.name, image: { url: image }, fields: [ { name: 'Deckstats URL:', value: url } ], footer: { text: `${index + 1}/${urls.length}` } }) ], components: [ { components: [
        { type: 'BUTTON', customId: 'decks-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: index === 0 },
        { type: 'BUTTON', customId: 'decks-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: index === 0 },
        { type: 'BUTTON', customId: 'decks-list', emoji: '\uD83D\uDCC4', label: 'Decklist', style: 'PRIMARY' },
        { type: 'BUTTON', customId: 'decks-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: index === urls.length - 1 },
        { type: 'BUTTON', customId: 'decks-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: index === urls.length - 1 },
    ], type: 'ACTION_ROW' } ] }
    await (!button ? interaction.editReply(options) : button.update(options))
    interaction.channel.createMessageComponentCollector({ filter: b => b.user.id === interaction.user.id && b.customId.startsWith(interaction.commandName), time: 300_000, componentType: 'BUTTON', max: 1 })
        .once('end', async b => {
            await interaction.editReply({ components: [] }).catch()
            if (!b.at(0)) return
            switch (b.at(0).customId) {
                case 'decks-doublearrowleft':
                    void parseDeck(interaction, urls, b.at(0))
                    break
                case 'decks-arrowleft':
                    void parseDeck(interaction, urls, b.at(0), index - 1)
                    break
                case 'decks-list':
                    b.at(0).update({ content: await getList(apiUrl), embeds: [], components: [] }).catch(() => b.at(0).update({ embeds: [ generateEmbed('error', { title: 'There seems to be something wrong with the Deckstats API at the moment. Try again later' }) ], components: [] }))
                    break
                case 'decks-arrowright':
                    void parseDeck(interaction, urls, b.at(0), index + 1)
                    break
                case 'decks-doublearrowright':
                    void parseDeck(interaction, urls, b.at(0), urls.length - 1)
                    break
            }
        })
}

async function getDeck(interaction: CommandInteraction, info: BotInfo): Promise<undefined> {
    void parseDeck(interaction, await info.database.select('mtg_decks') as unknown as { url: string }[])
    return undefined
}

export const command = new ChatCommand({
    name: 'decks',
    description: 'Get a deck from Potato\'s database',
}, { respond: getDeck, ephemeral: true })