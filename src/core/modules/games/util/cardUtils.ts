import { createCanvas, loadImage } from 'canvas'
import { MessageEmbedOptions, MessageOptions } from 'discord.js'
import { generateEmbed } from '../../../utils/generators'
import { Card } from './Deck'

async function mergeImages(filePaths: string[], options: { width: number; height: number }): Promise<Buffer> {
    const activeCanvas = createCanvas(options.width, options.height)
    const ctx = activeCanvas.getContext('2d')
    for (const [ i, path ] of filePaths.entries()) {
        const image = await loadImage(path)
        ctx.drawImage(image, i * (options.width / filePaths.length), 0)
    }
    return activeCanvas.toBuffer()
}

export async function multicardMessage(cards: Card[], embedType: 'info' | 'prompt', embedOptions: MessageEmbedOptions): Promise<MessageOptions> {
    const hand = generateEmbed(embedType, embedOptions)
    if (cards.length === 1) {
        hand.image = { url: cards[0].image }
        return { embeds: [ hand ] }
    }
    const filePaths: string[] = []
    for (const card of cards) {
        filePaths.push(`./assets/img/cards/${card.code}.png`)
    }
    hand.image = { url: 'attachment://cards.jpg' }
    return { embeds: [ hand ], files: [ { attachment: await mergeImages(filePaths, { width: filePaths.length * 226, height: 314 }), name: 'cards.jpg' } ] }
}