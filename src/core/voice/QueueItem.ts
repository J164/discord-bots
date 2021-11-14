import { MessageEmbed, InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../utils/commonFunctions'

export class QueueItem {

    public readonly url: string
    public readonly title: string
    public readonly thumbnail: string
    public readonly duration: number
    public looping: boolean

    public constructor(url: string, title: string, thumbnail: string, duration: number) {
        this.url = url
        this.title = title
        this.thumbnail = thumbnail
        this.duration = duration
        this.looping = false
    }

    public generateEmbed(): MessageEmbed {
        let hour = Math.floor(this.duration / 3600).toString()
        let min = Math.floor((this.duration % 3600) / 60).toString()
        let sec = (this.duration % 60).toString()
        if (hour.length < 2) {
            hour = `0${hour}`
        }
        if (min.length < 2) {
            min = `0${min}`
        }
        if (sec.length < 2) {
            sec = `0${sec}`
        }
        const embed = generateEmbed('info', {
            title: `Now Playing: ${this.title} (${hour}:${min}:${sec})`,
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
            return { embeds: [ generateEmbed('success', { title: 'No longer looping' }) ] }
        }
        this.looping = true
        return { embeds: [ generateEmbed('success', { title: 'Now Looping' }) ] }
    }
}