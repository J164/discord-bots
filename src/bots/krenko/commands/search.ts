import { createCanvas, loadImage } from 'canvas'
import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, InteractionReplyOptions, InteractionUpdateOptions, SelectMenuInteraction } from 'discord.js'
import { request } from 'undici'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'

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
    name: 'search',
    description: 'Search for Magic cards',
    options: [ {
        name: 'query',
        description: 'What to search for',
        type: 'STRING',
        required: true
    } ]
}

async function mergeImages(filePaths: string[], options: { width: number; height: number }): Promise<Buffer> {
    const activeCanvas = createCanvas(options.width, options.height)
    const ctx = activeCanvas.getContext('2d')
    for (const [ i, path ] of filePaths.entries()) {
        const image = await loadImage(path)
        ctx.drawImage(image, i * (options.width / filePaths.length), 0)
    }
    return activeCanvas.toBuffer()
}

function formatResponse(response: ScryfallResponse): MagicCard[][] {
    const cards: MagicCard[][] = []
    for (let r = 0; r < Math.ceil(response.data.length / 5); r++) {
        cards.push([])
        for (let i = 0; i < 5; i++) {
            if (r * 5 + i > response.data.length - 1) {
                break
            }
            cards[r].push(response.data[r * 5 + i])
        }
    }
    return cards
}

async function generateResponse(results: MagicCard[][], r: number, i: number): Promise<InteractionUpdateOptions> {
    const card = results[r][i]
    if (card.card_faces) {
        return { embeds: [ generateEmbed('info', { title: card.name, footer: { text: `Price ($): ${card.prices.usd}` ?? 'unknown (not for sale)' }, image: { url: 'attachment://card.jpg' } }) ], files: [ { attachment: await mergeImages([ card.card_faces[0].image_uris.large, card.card_faces[1].image_uris.large ], { width: 1344, height: 936 }), name: 'card.jpg' } ], components: [] }
    }
    return { embeds: [ generateEmbed('info', { title: card.name, footer: { text: `Price ($): ${card.prices.usd}` ?? 'unknown (not for sale)' }, image: { url: card.image_uris.large } }) ], components: [] }
}

async function search(interaction: CommandInteraction, info: GuildInfo, results: MagicCard[][] = null, component: ButtonInteraction | SelectMenuInteraction = null, i = 0): Promise<InteractionReplyOptions> {
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
        footer: { text: `${i + 1}/${results.length}` }
    })
    for (const [ index, entry ] of results[i].entries()) {
        embed.fields.push({ name: `${index + 1}.`, value: `${entry.name}` })
    }
    const selectOptions: { label: string, description: string, value: string }[] = []
    for (let r = 0; r < results[i].length; r++) {
        selectOptions.push({
            label: (r + 1).toString(),
            description: results[i][r].name,
            value: (r + 1).toString()
        })
    }
    const options: InteractionReplyOptions = { embeds: [ embed ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'search-options', placeholder: 'Select a Card', options: selectOptions } ], type: 'ACTION_ROW' }, { components: [
        { type: 'BUTTON', customId: 'search-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: i === 0 },
        { type: 'BUTTON', customId: 'search-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: i === 0 },
        { type: 'BUTTON', customId: 'search-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: i === results.length - 1 },
        { type: 'BUTTON', customId: 'search-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: i === results.length - 1 }
    ], type: 'ACTION_ROW' } ] }
    if (component) {
        await component.update(options)
    } else {
        await interaction.editReply(options)
    }
    const filter: CollectorFilter<[ButtonInteraction | SelectMenuInteraction]> = b => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
    const collector = <InteractionCollector<ButtonInteraction | SelectMenuInteraction>> interaction.channel.createMessageComponentCollector({ filter: filter, time: 60000 })
    collector.once('collect', async c => {
        if (c.isSelectMenu()) {
            c.update(await generateResponse(results, i, parseInt(c.values[0]) - 1))
            return
        }
        switch (c.customId) {
            case 'search-doublearrowleft':
                search(interaction, info, results, c)
                break
            case 'search-arrowleft':
                search(interaction, info, results, c, i - 1)
                break
            case 'search-arrowright':
                search(interaction, info, results, c, i + 1)
                break
            case 'search-doublearrowright':
                search(interaction, info, results, c, results.length - 1)
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

module.exports = { data: data, execute: search }