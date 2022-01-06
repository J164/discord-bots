import canvas from 'canvas'
import { ButtonInteraction, CommandInteraction, InteractionReplyOptions, InteractionUpdateOptions, SelectMenuInteraction } from 'discord.js'
import { request } from 'undici'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

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

async function mergeImages(filePaths: string[], options: { width: number; height: number }): Promise<Buffer> {
    const activeCanvas = canvas.createCanvas(options.width, options.height)
    const context = activeCanvas.getContext('2d')
    for (const [ index, path ] of filePaths.entries()) {
        const image = await canvas.loadImage(path)
        context.drawImage(image, index * (options.width / filePaths.length), 0)
    }
    return activeCanvas.toBuffer()
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

async function search(interaction: CommandInteraction, info: GuildInfo, results?: MagicCard[][], component?: ButtonInteraction | SelectMenuInteraction, page = 0): Promise<InteractionReplyOptions> {
    if (!results) {
        const searchTerm = interaction.options.getString('query')
        try {
            const response = <ScryfallResponse> await (await request(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchTerm)}`)).body.json()
            results = formatResponse(response)
        } catch {
            return { embeds: [ generateEmbed('error', {
                title: 'Card Not Found',
                fields: [ {
                    name: `${searchTerm} not found`,
                    value: 'Check your spelling and/or try using a more general search term'
                } ]
            }) ]}
        }
    }
    const embed = generateEmbed('info', {
        title: 'Results',
        footer: { text: `${page + 1}/${results.length}` },
        fields: []
    })
    for (const [ index, entry ] of results[page].entries()) {
        embed.fields.push({ name: `${index + 1}.`, value: `${entry.name}` })
    }
    const selectOptions: { label: string, description: string, value: string }[] = []
    for (let r = 0; r < results[page].length; r++) {
        selectOptions.push({
            label: (r + 1).toString(),
            description: results[page][r].name,
            value: (r + 1).toString()
        })
    }
    const options: InteractionReplyOptions = { embeds: [ embed ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'search-options', placeholder: 'Select a Card', options: selectOptions } ], type: 'ACTION_ROW' }, { components: [
        { type: 'BUTTON', customId: 'search-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: page === 0 },
        { type: 'BUTTON', customId: 'search-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: page === 0 },
        { type: 'BUTTON', customId: 'search-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: page === results.length - 1 },
        { type: 'BUTTON', customId: 'search-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: page === results.length - 1 }
    ], type: 'ACTION_ROW' } ] }
    await (component ? component.update(options) : interaction.editReply(options))
    const filter = (b: SelectMenuInteraction<'cached'> | ButtonInteraction<'cached'>) => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
    const collector = interaction.channel.createMessageComponentCollector({ filter: filter, time: 60_000 })
    collector.once('collect', async c => {
        if (c.isSelectMenu()) {
            c.update(await generateResponse(results, page, Number.parseInt(c.values[0]) - 1))
            return
        }
        if (!c.isButton()) return
        switch (c.customId) {
            case 'search-doublearrowleft':
                search(interaction, info, results, c)
                break
            case 'search-arrowleft':
                search(interaction, info, results, c, page - 1)
                break
            case 'search-arrowright':
                search(interaction, info, results, c, page + 1)
                break
            case 'search-doublearrowright':
                search(interaction, info, results, c, results.length - 1)
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

export const command: Command = { data: {
    name: 'search',
    description: 'Search for Magic cards',
    options: [ {
        name: 'query',
        description: 'What to search for',
        type: 'STRING',
        required: true
    } ]
}, execute: search, ephemeral: true }