import { createCanvas, loadImage } from 'canvas'
import { MessageAttachment, MessageEmbedOptions, MessageOptions, ThreadChannel } from 'discord.js'
import { generateEmbed } from '../../../utils/generators'
import { BaseGame } from './BaseGame'
import { Card } from './Deck'

export abstract class BaseCardGame extends BaseGame {

    public constructor(gameChannel: ThreadChannel) {
        super(gameChannel)
    }

    protected async multicardMessage(cards: Card[], embedType: 'info' | 'prompt', embedOptions: MessageEmbedOptions): Promise<MessageOptions> {
        const hand = generateEmbed(embedType, embedOptions)
        if (cards.length === 1) {
            hand.setImage(cards[0].image)
            return { embeds: [ hand ] }
        }
        const filePaths: string[] = []
        for (const card of cards) {
            filePaths.push(`./assets/img/cards/${card.code}.png`)
        }
        const file = new MessageAttachment(await this.mergeImages(filePaths, {
            width: filePaths.length * 226,
            height: 314
        }), 'cards.jpg')
        hand.setImage('attachment://cards.jpg')
        return { embeds: [ hand ], files: [ file ] }
    }

    private async mergeImages(filePaths: string[], options: { width: number; height: number }): Promise<Buffer> {
        const activeCanvas = createCanvas(options.width, options.height)
        const ctx = activeCanvas.getContext('2d')
        for (const [ i, path ] of filePaths.entries()) {
            const image = await loadImage(path)
            ctx.drawImage(image, i * (options.width / filePaths.length), 0)
        }
        return activeCanvas.toBuffer()
    }
}