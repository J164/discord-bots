import { MessageEmbed, InteractionReplyOptions } from 'discord.js'
import EventEmitter from 'events'
import { existsSync, writeFileSync } from 'fs'
import { genericEmbed } from '../utils/commonFunctions'
import { config } from '../utils/constants'
import youtubedl from 'youtube-dl-exec'
import { YTResponse } from '../utils/interfaces'

export class QueueItem extends EventEmitter {

    public readonly webpageUrl: string
    public readonly title: string
    public readonly id: string
    public thumbnail: string
    public readonly duration: number
    public looping: boolean
    private downloading: boolean
    public failed: boolean

    public constructor(webpageUrl: string, title: string, id: string, thumbnail: string, duration: number) {
        super()
        this.webpageUrl = webpageUrl
        this.title = title
        this.id = id
        this.thumbnail = thumbnail
        this.duration = duration
        this.looping = false
        this.downloading = false
        this.failed = false
    }

    public generateEmbed(): MessageEmbed {
        const embed = genericEmbed({
            title: `Now Playing: ${this.title}`,
            fields: [ {
                name: 'URL:',
                value: this.webpageUrl
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

    public isDownloaded(): boolean {
        if (existsSync(`${config.data}/music_files/playback/${this.id}.json`)) {
            return true
        }
        this.download()
        return false
    }

    public async download(): Promise<void> {
        if (this.downloading) {
            return
        }
        this.downloading = true
        let output: YTResponse
        try {
            output = await youtubedl(this.webpageUrl, {
                noWarnings: true,
                noCallHome: true,
                noCheckCertificate: true,
                preferFreeFormats: true,
                ignoreErrors: true,
                geoBypass: true,
                printJson: true,
                format: 'bestaudio[ext=webm+acodec=opus+asr=48000]',
                output: `${config.data}/music_files/playback/%(id)s.%(ext)s`
            })
        } catch (err) {
            console.log('could not download song')
            console.log(err)
            this.failed = true
            this.emit('failed')
            return
        }
        this.thumbnail = output.thumbnails[0].url
        const metaData = JSON.stringify({
            // eslint-disable-next-line camelcase
            webpage_url: this.webpageUrl,
            title: this.title,
            id: this.id,
            thumbnail: this.thumbnail,
            duration: this.duration
        })
        writeFileSync(`${config.data}/music_files/playback/${this.id}.json`, metaData)
        this.emit('downloaded')
    }
}