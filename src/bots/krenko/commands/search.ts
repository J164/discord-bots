import { Message, MessageEmbed, MessageReaction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbedResponse, makeGetRequest } from '../../../core/common'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

interface Card {
    name: string,
    uri: string,
    // eslint-disable-next-line camelcase
    image_uris: {
        large: string
    }
    prices: {
        usd: string
    }
}

interface ScryfallResponse {
    status?: string
    data: Card[]
}

function formatResponse(response: ScryfallResponse): Card[][] {
    const cards: Card[][] = []
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

function generateEmojiList(results: Card[][], i: number): string[] {
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

async function search(message: Message, info: KrenkoGuildInputManager, results: Card[][] = null, i = 0): Promise<MessageEmbed> {
    if (!results) {
        const searchArr = message.content.split(' ')
        searchArr.shift()
        const searchTerm = searchArr.join(' ')
        try {
        const response = <ScryfallResponse> await makeGetRequest(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchTerm)}`)
        results = formatResponse(response)
        } catch {
            return genericEmbedResponse('Card Not Found').addField(`${searchTerm} not found`, 'Check your spelling and/or try using a more general search term')
        }
    }
    const embed = genericEmbedResponse('Results').setFooter(`${i + 1}/${results.length}`)
    for (const [ index, entry ] of results[i].entries()) {
        embed.addField(`${index + 1}.`, `${entry.name}`)
    }
    const menu = await message.channel.send(embed)
    const emojiList = generateEmojiList(results, i)
    const reactions: MessageReaction[] = []
    for (const emoji of emojiList) {
        reactions.push(await menu.react(emoji))
    }
    function filter(reaction: MessageReaction): boolean { return reaction.client === message.client }
    const reactionCollection = await menu.awaitReactions(filter, { max: 1, time: 60000})
    const reactionResult = reactionCollection.first()
    if (!reactionResult) {
        for (const reaction of reactions) {
            reaction.remove()
        }
        return
    }
    if (reactionResult.emoji.name.slice(1) === '\uFE0F\u20E3' && parseInt(reactionResult.emoji.name[0]) <= results[i].length) {
        menu.delete()
        const card = results[i][parseInt(reactionResult.emoji.name[0]) - 1]
        return genericEmbedResponse(card.name).setImage(card.image_uris.large).setFooter(`$${card.prices.usd}`)
    }
    switch (reactionResult.emoji.name) {
        case '\u2B05\uFE0F':
            await menu.delete()
            search(message, info, results, i - 1)
            break
        case '\u23EA':
            await menu.delete()
            search(message, info, results)
            break
        case '\u27A1\uFE0F':
            await menu.delete()
            search(message, info, results, i + 1)
            break
        case '\u23E9':
            await menu.delete()
            search(message, info, results, results.length - 1)
            break
        default:
            menu.delete()
            break
    }
}

module.exports = new BaseCommand([ 'search' ], search)