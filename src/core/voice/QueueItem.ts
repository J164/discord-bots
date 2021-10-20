import { MessageEmbed, InteractionReplyOptions } from 'discord.js'
import { createWriteStream, writeFileSync } from 'fs'
import { genericEmbed } from '../utils/commonFunctions'
import { config } from '../utils/constants'
import ytdl from 'ytdl-core'

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
        const embed = genericEmbed({
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

    //untested and unused
    public async download(): Promise<void> {
        try {
            writeFileSync(`${config.data}/music_files/playback/${this.id}.webm`, '')
            ytdl(this.url, {
                filter: format => format.container === 'webm' && format.audioSampleRate === '48000' && format.codecs === 'opus'
            }).pipe(createWriteStream(`${config.data}/music_files/playback/${this.id}.webm`))
        } catch (err) {
            console.log('could not download song')
            console.log(err)
        }
    }
}