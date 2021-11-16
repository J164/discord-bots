import { createCanvas, loadImage } from 'canvas'
import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, InteractionReplyOptions, InteractionUpdateOptions, MessageActionRow, MessageAttachment, MessageButton, MessageSelectMenu, SelectMenuInteraction } from 'discord.js'
import { request } from 'undici'
import { generateEmbed } from '../../../core/utils/commonFunctions'
import { ScryfallResponse, MagicCard, GuildInfo } from '../../../core/utils/interfaces'

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
    const embed = generateEmbed('info', { title: card.name })
    let reply: InteractionReplyOptions
    if (card.card_faces) {
        const attachment = new MessageAttachment(await mergeImages([ card.card_faces[0].image_uris.large, card.card_faces[1].image_uris.large ], { width: 1344, height: 936 }), 'card.jpg')
        embed.setImage('attachment://card.jpg')
        reply = { embeds: [ embed.setFooter(`Price ($): ${card.prices.usd ?? 'unknown (not for sale)'}`) ], files: [ attachment ], components: [] }
    } else {
        embed.setImage(card.image_uris.large)
        reply = { embeds: [ embed.setFooter(`Price ($): ${card.prices.usd ?? 'unknown (not for sale)'}`) ], components: [] }
    }
    return reply
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
        embed.addField(`${index + 1}.`, `${entry.name}`)
    }
    const buttons = [ new MessageButton({ customId: 'search-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'search-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'search-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'search-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY' }) ]
    if (i === 0) {
        buttons[0].setDisabled(true)
        buttons[1].setDisabled(true)
    }
    if (i === results.length - 1) {
        buttons[2].setDisabled(true)
        buttons[3].setDisabled(true)
    }
    const selectOptions: { label: string, description: string, value: string }[] = []
    for (let r = 0; r < results[i].length; r++) {
        selectOptions.push({
            label: (r + 1).toString(),
            description: results[i][r].name,
            value: (r + 1).toString()
        })
    }
    const select = new MessageSelectMenu({ customId: 'search-options', placeholder: 'Select a Card', options: selectOptions })
    const row1 = new MessageActionRow().addComponents(select)
    const row2 = new MessageActionRow().addComponents(buttons)
    const options: InteractionReplyOptions = { embeds: [ embed ], components: [ row1, row2 ] }
    if (component) {
        await component.update(options)
    } else {
        await interaction.editReply(options)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: CollectorFilter<[any]> = b => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
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
            default:
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

module.exports = { data: data, execute: search }