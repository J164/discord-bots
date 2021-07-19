import { MessageEmbed, TextChannel, VoiceChannel } from 'discord.js'
import EventEmitter = require('events')
import { existsSync, writeFileSync } from 'fs'
import { home, genericEmbedResponse } from '../../core/common'
import { VoiceManager } from '../../core/VoiceManager'
import * as ffmpeg from 'fluent-ffmpeg'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

export class QueueItem extends EventEmitter {
    public readonly webpageUrl: string
    public readonly title: string
    public readonly id: string
    public thumbnail: string
    public readonly duration: number
    public looping: boolean
    private downloading: boolean

    public constructor(webpageUrl: string, title: string, id: string, thumbnail: string, duration: number) {
        super()
        this.webpageUrl = webpageUrl
        this.title = title
        this.id = id
        this.thumbnail = thumbnail
        this.duration = duration
        this.looping = false
        this.downloading = false
    }

    public isDownloaded(): boolean {
        if (existsSync(`${home}/music_files/playback/${this.id}.json`)) {
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
        const output = await youtubedl(this.webpageUrl, {
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            ignoreErrors: true,
            geoBypass: true,
            printJson: true,
            format: 'bestaudio',
            output: `${home}/music_files/playback/%(id)s.mp3`
        })
        this.thumbnail = output.thumbnails[0].url
        const metaData = JSON.stringify({
            webpageUrl: this.webpageUrl,
            title: this.title,
            id: this.id,
            thumbnail: this.thumbnail,
            duration: this.duration
        })
        ffmpeg(`${home}/music_files/playback/${this.id}.mp3`)
            .format('ogg')
            .audioBitrate('96k')
            .once('end', () => {
                //unlinkSync(`${home}/music_files/playback/${this.id}.mp3`)
                writeFileSync(`${home}/music_files/playback/${this.id}.json`, metaData)
                this.emit('downloaded')
            })
            .on('error', err => { console.log(err) })
            .save(`${home}/music_files/playback/${this.id}.ogg`)
    }
}

export class PotatoVoiceManager extends VoiceManager {

    private queue: QueueItem[]
    private downloadQueue: QueueItem[]
    private boundChannel: TextChannel
    private downloading: boolean
    private nowPlaying: MessageEmbed
    private queueLoop: boolean
    private songLoop: boolean

    public constructor() {
        super()
        this.queue = []
        this.downloadQueue = []
        this.downloading = false
        this.queueLoop = false
        this.songLoop = false
    }

    public addToQueue(duration: number, webpageUrl: string, title: string, id: string, thumbnail: string): void {
        if (duration < 5400) {
            const song = new QueueItem(webpageUrl, title, id, thumbnail, duration)
            this.queue.push(song)
            if (!thumbnail) {
                this.downloadQueue.push(song)
                if (!this.downloading) {
                    this.download()
                }
            }
        }
    }

    public async connect(voiceChannel: VoiceChannel): Promise<void> {
        await super.connect(voiceChannel)
        if (this.queue.length < 1) {
            this.reset()
            return
        }
        this.checkSongStatus()
    }

    public bindChannel(channel: TextChannel): void {
        this.boundChannel = channel
    }

    private async checkSongStatus(): Promise<void> {
        if (this.queue.length < 1) {
            this.reset()
            return
        }
        this.playing = true
        const song = this.queue.shift()
        if (!song.isDownloaded()) {
            song.once('downloaded', () => {
                this.playSong(song)
            })
            return
        }
        this.playSong(song)
    }

    private async playSong(song: QueueItem): Promise<void> {
        this.createStream(`${home}/music_files/playback/${song.id}.mp3`)
        this.nowPlaying = genericEmbedResponse(`Now Playing: ${song.title}`)
        this.nowPlaying.setImage(song.thumbnail)
        this.nowPlaying.addField('URL:', song.webpageUrl)
        if (!song.looping) {
            this.boundChannel.send(this.nowPlaying)
        }
        if (this.songLoop) {
            song.looping = true
        }
        this.streamDispatcher.once('finish', () => {
            if (this.queueLoop) {
                this.queue.push(song)
            } else if (this.songLoop) {
                this.queue.unshift(song)
            }
            this.streamDispatcher.destroy()
            this.playing = false
            this.checkSongStatus()
        })
    }

    public async download(): Promise<void> {
        if (this.downloadQueue.length < 1) {
            this.downloading = false
            return
        }
        this.downloading = true
        const currentItem = this.downloadQueue.shift()
        await currentItem.download()
        currentItem.once('downloaded', () => {
            this.download()
        })
    }

    public loopSong(): string {
        if (!this.streamDispatcher) {
            return 'Nothing is playing!'
        }
        if (this.songLoop) {
            this.songLoop = false
            this.nowPlaying.setFooter('')
            return 'No longer looping'
        }
        this.songLoop = true
        this.nowPlaying.setFooter('Looping', 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png')
        return 'Now looping'
    }

    public loopQueue(): string {
        if (!this.streamDispatcher) {
            return 'Nothing is playing!'
        }
        if (this.queueLoop) {
            this.queueLoop = false
            return 'No longer looping queue'
        }
        this.queueLoop = true
        return 'Now looping queue'
    }

    public clear(): boolean {
        if (this.queue.length < 1) {
            return false
        }
        this.queue = []
        this.downloadQueue = []
        this.queueLoop = false
        return true
    }

    public skip(): boolean {
        if (!this.streamDispatcher) {
            return false
        }
        this.streamDispatcher.end()
        return true
    }

    public shuffleQueue(): boolean {
        if (this.queue.length < 1) {
            return false
        }
        for (let i = this.queue.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1))
            const temp = this.queue[i]
            this.queue[i] = this.queue[randomIndex]
            this.queue[randomIndex] = temp
        }
        return true
    }

    public getNowPlaying(): string | MessageEmbed {
        if (!this.nowPlaying) {
            return 'Nothing has played yet!'
        }
        return this.nowPlaying
    }

    public getQueue(): QueueItem[][] {
        if (this.queue.length < 1) {
            return null
        }
        const queueArray: QueueItem[][] = []
        for (let r = 0; r < Math.ceil(this.queue.length / 25); r++) {
            queueArray.push([])
            for (let i = 0; i < 25; i++) {
                if (r * 25 + i > this.queue.length - 1) {
                    break
                }
                queueArray[r].push(this.queue[r * 25 + i])
            }
        }
        return queueArray
    }

    public getQueueLoop(): boolean {
        if (this.queueLoop) {
            return true
        }
        return false
    }

    public reset(): void {
        super.reset()
        this.queue = []
        this.downloadQueue = []
        this.boundChannel = null
        this.downloading = false
        this.nowPlaying = null
        this.queueLoop = false
        this.songLoop = false
    }
}