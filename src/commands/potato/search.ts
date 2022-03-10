import { createCanvas, Image } from '@napi-rs/canvas'
import { ButtonInteraction, CommandInteraction, InteractionReplyOptions, InteractionUpdateOptions, SelectMenuInteraction } from 'discord.js'
import { request } from 'undici'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { BotInfo } from '../../core/utils/interfaces.js'
import { Buffer } from 'node:buffer'

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

async function mergeImages(remotePaths: string[], options: { width: number; height: number }): Promise<Buffer> {
    const activeCanvas = createCanvas(options.width, options.height)
    const context = activeCanvas.getContext('2d')
    for (const [ index, path ] of remotePaths.entries()) {
        const image = new Image()
        image.src = Buffer.from(await (await request(path)).body.arrayBuffer())
        context.drawImage(image, index * (options.width / remotePaths.length), 0)
    }
    return activeCanvas.toBuffer('image/png')
}

function formatResponse(response: ScryfallResponse): MagicCard[][] {
    const cards: MagicCard[][] = []
    for (let r = 0; r < Math.ceil(response.data.length / 5); r++) {
        cards.push([])
        for (let index = 0; index < 5; index++) {
            if (r * 5 + index > response.data.length - 1) {
                break
            }
            cards[r].push(response.data[r * 5 + index])
        }
    }
    return cards
}

async function generateResponse(results: MagicCard[][], r: number, index: number): Promise<InteractionUpdateOptions> {
    const card = results[r][index]
    if (card.card_faces) {
        return { embeds: [ generateEmbed('info', { title: card.name, footer: { text: `Price ($): ${card.prices.usd}` ?? 'unknown (not for sale)' }, image: { url: 'attachment://card.jpg' } }) ], files: [ { attachment: await mergeImages([ card.card_faces[0].image_uris.large, card.card_faces[1].image_uris.large ], { width: 1344, height: 936 }), name: 'card.jpg' } ], components: [] }
    }
    return { embeds: [ generateEmbed('info', { title: card.name, footer: { text: `Price ($): ${card.prices.usd}` ?? 'unknown (not for sale)' }, image: { url: card.image_uris.large } }) ], components: [] }
}

async function search(interaction: CommandInteraction, info: BotInfo, results?: MagicCard[][], component?: ButtonInteraction | SelectMenuInteraction, page = 0): Promise<InteractionReplyOptions> {
    if (!results) {
        const searchTerm = interaction.options.getString('query')
        try {
            const response = await (await request(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchTerm)}`)).body.json() as ScryfallResponse
            results = formatResponse(response)
        } catch {
            return { embeds: [ generateEmbed('error', {
                title: 'Card Not Found',
                fields: [ {
                    name: `${searchTerm} not found`,
                    value: 'Check your spelling and/or try using a more general search term',
                } ],
            }) ]}
        }
    }
    const embed = generateEmbed('info', {
        title: 'Results',
        footer: { text: `${page + 1}/${results.length}` },
        fields: [],
    })
    for (const [ index, entry ] of results[page].entries()) {
        embed.fields.push({ name: `${index + 1}.`, value: `${entry.name}` })
    }
    const selectOptions: { label: string, description: string, value: string }[] = []
    for (let r = 0; r < results[page].length; r++) {
        selectOptions.push({
            label: (r + 1).toString(),
            description: results[page][r].name,
            value: (r + 1).toString(),
        })
    }
    const options: InteractionReplyOptions = { embeds: [ embed ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'search-options', placeholder: 'Select a Card', options: selectOptions } ], type: 'ACTION_ROW' }, { components: [
        { type: 'BUTTON', customId: 'search-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: page === 0 },
        { type: 'BUTTON', customId: 'search-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: page === 0 },
        { type: 'BUTTON', customId: 'search-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: page === results.length - 1 },
        { type: 'BUTTON', customId: 'search-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: page === results.length - 1 },
    ], type: 'ACTION_ROW' } ] }
    await (component ? component.update(options) : interaction.editReply(options))
    interaction.channel.createMessageComponentCollector({ filter: b => b.user.id === interaction.user.id && b.customId.startsWith(interaction.commandName), time: 300_000, max: 1 })
        .once('end', async c => {
            void interaction.editReply({ components: [] }).catch()
            if (!c.at(0)) return
            const response = c.at(0)
            if (response.isSelectMenu()) {
                void response.update(await generateResponse(results, page, Number.parseInt(response.values[0]) - 1))
                return
            }
            if (!response.isButton()) return
            switch (c.at(0).customId) {
                case 'search-doublearrowleft':
                    void search(interaction, info, results, response)
                    break
                case 'search-arrowleft':
                    void search(interaction, info, results, response, page - 1)
                    break
                case 'search-arrowright':
                    void search(interaction, info, results, response, page + 1)
                    break
                case 'search-doublearrowright':
                    void search(interaction, info, results, response, results.length - 1)
                    break
            }
        })
}

export const command = new ChatCommand({
    name: 'search',
    description: 'Search for Magic cards',
    options: [ {
        name: 'query',
        description: 'What to search for',
        type: 'STRING',
        required: true,
    } ],
}, { respond: search, ephemeral: true })