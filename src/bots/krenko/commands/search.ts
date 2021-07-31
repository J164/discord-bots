import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, MessageAttachment, MessageReaction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { clearReactions, genericEmbedResponse, makeGetRequest, mergeImages } from '../../../core/commonFunctions'
import { ScryfallResponse, MagicCard } from '../../../core/interfaces'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

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

function generateEmojiList(results: MagicCard[][], i: number): string[] {
    const emojiList = []
    for (let r = 1; r <= results[i].length; r++) {
        emojiList.push(`${r}\uFE0F\u20E3`)
    }
    emojiList.push('\u274C')
    if (i !== 0) {
        emojiList.unshift('\u2B05\uFE0F')
        emojiList.unshift('\u23EA')
    }
    if (i !== results.length - 1) {
        emojiList.push('\u27A1\uFE0F')
        emojiList.push('\u23E9')
    }
    return emojiList
}

async function generateResponse(results: MagicCard[][], r: number, i: number): Promise<InteractionReplyOptions> {
    const card = results[r][i]
    const embed = genericEmbedResponse(card.name)
    let reply: InteractionReplyOptions
    if (card.card_faces) {
        const attachment = new MessageAttachment(await mergeImages([ card.card_faces[0].image_uris.large, card.card_faces[1].image_uris.large ], { width: 1344, height: 936 }), 'card.jpg')
        embed.setImage('attachment://card.jpg')
        reply = { embeds: [ embed.setFooter(`Price ($): ${card.prices.usd ?? 'unknown (not for sale)'}`) ], files: [ attachment ] }
    } else {
        embed.setImage(card.image_uris.large)
        reply = { embeds: [ embed.setFooter(`Price ($): ${card.prices.usd ?? 'unknown (not for sale)'}`) ] }
    }
    return reply
}

async function search(interaction: CommandInteraction, info: KrenkoGuildInputManager, results: MagicCard[][] = null, i = 0): Promise<InteractionReplyOptions> {
    if (!results) {
        const searchTerm = interaction.options.getString('query')
        try {
        const response = <ScryfallResponse> await makeGetRequest(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchTerm)}`)
        results = formatResponse(response)
        } catch {
            return { embeds: [ genericEmbedResponse('Card Not Found').addField(`${searchTerm} not found`, 'Check your spelling and/or try using a more general search term') ] }
        }
    }
    const embed = genericEmbedResponse('Results').setFooter(`${i + 1}/${results.length}`)
    for (const [ index, entry ] of results[i].entries()) {
        embed.addField(`${index + 1}.`, `${entry.name}`)
    }
    const rawMenu = await interaction.editReply({ embeds: [ embed ] })
    const menu = await interaction.channel.messages.fetch(rawMenu.id)
    const emojiList = generateEmojiList(results, i)
    const reactions: MessageReaction[] = []
    for (const emoji of emojiList) {
        reactions.push(await menu.react(emoji))
    }
    function filter(reaction: MessageReaction): boolean { return reaction.client === interaction.client }
    const reactionCollection = await menu.awaitReactions({ filter, max: 1, time: 60000 })
    const reactionResult = reactionCollection.first()
    if (!reactionResult) {
        clearReactions(reactions)
        return
    }
    const resultNum = parseInt(reactionResult.emoji.name[0])
    if (reactionResult.emoji.name.slice(1) === '\uFE0F\u20E3' && resultNum <= results[i].length) {
        await clearReactions(reactions)
        interaction.editReply(await generateResponse(results, i, resultNum - 1))
        return
    }
    switch (reactionResult.emoji.name) {
        case '\u2B05\uFE0F':
            await clearReactions(reactions)
            search(interaction, info, results, i - 1)
            break
        case '\u23EA':
            await clearReactions(reactions)
            search(interaction, info, results)
            break
        case '\u27A1\uFE0F':
            await clearReactions(reactions)
            search(interaction, info, results, i + 1)
            break
        case '\u23E9':
            await clearReactions(reactions)
            search(interaction, info, results, results.length - 1)
            break
        default:
            menu.delete()
            break
    }
}

module.exports = new BaseCommand(data, search)