import { MessageEmbed, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../utils/commonFunctions'

export class QueueItem {

    public readonly url: string
    public readonly title: string
    public readonly id: string
    public readonly thumbnail: string
    public readonly duration: number
    public looping: boolean

    public constructor(url: string, title: string, id: string, thumbnail: string, duration: number) {
        this.url = url
        this.title = title
        this.id = id
        this.thumbnail = thumbnail
        this.duration = duration
        this.looping = false
    }

    public generateEmbed(): MessageEmbed {
        const embed = generateEmbed('info', {
            title: `Now Playing: ${this.title}`,
            fields: [ {
                name: 'URL:',
                value: this.url
            } ],
            image: { url: this.thumbnail }
        })
        if (this.looping) {
            embed.setFooter('Looping', 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png')
        }
        return embed
    }

    public loop(): InteractionReplyOptions {
        if (this.looping) {
            this.looping = false
            return { content: 'No longer looping' }
        }
        this.looping = true
        return { content: 'Now Looping' }
    }
}