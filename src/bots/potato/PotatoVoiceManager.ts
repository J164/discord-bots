import { InteractionReplyOptions, MessageEmbed, TextChannel, VoiceChannel } from 'discord.js'
import EventEmitter = require('events')
import { existsSync, writeFileSync } from 'fs'
import { genericEmbedResponse } from '../../core/commonFunctions'
import { VoiceManager } from '../../core/VoiceManager'
import { AudioPlayerStatus } from '@discordjs/voice'
import { config } from '../../core/constants'
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
        let output
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
            webpageUrl: this.webpageUrl,
            title: this.title,
            id: this.id,
            thumbnail: this.thumbnail,
            duration: this.duration
        })
        writeFileSync(`${config.data}/music_files/playback/${this.id}.json`, metaData)
        this.emit('downloaded')
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

    public async connect(voiceChannel: VoiceChannel): Promise<boolean> {
        if (!await super.connect(voiceChannel)) {
            return false
        }
        if (this.queue.length < 1) {
            this.reset()
            return false
        }
        this.checkSongStatus()
        return true
    }

    public bindChannel(channel: TextChannel): void {
        this.boundChannel = channel
    }

    private async checkSongStatus(): Promise<void> {
        if (this.queue.length < 1) {
            return
        }
        const song = this.queue.shift()
        if (song.failed) {
            this.checkSongStatus()
        }
        if (!song.isDownloaded()) {
            this.awaitingResource = true
            song.once('downloaded', () => {
                this.awaitingResource = false
                this.playSong(song)
            })
            song.once('failed', () => {
                this.checkSongStatus()
            })
            return
        }
        this.playSong(song)
    }

    private async playSong(song: QueueItem): Promise<void> {
        if (!await this.createStream(`${config.data}/music_files/playback/${song.id}.webm`)) {
            this.boundChannel.send('Something went wrong while preparing song')
            return
        }
        this.nowPlaying = genericEmbedResponse(`Now Playing: ${song.title}`).setImage(song.thumbnail).addField('URL:', song.webpageUrl)
        if (!song.looping) {
            this.boundChannel.send({ embeds: [ this.nowPlaying ] })
        }
        if (this.songLoop) {
            song.looping = true
        }
        this.player.on('stateChange', (oldState, newState) => {
            if (newState.status !== AudioPlayerStatus.Idle || oldState.status === AudioPlayerStatus.Idle) {
                return
            }
            this.player.removeAllListeners('stateChange')
            if (this.queueLoop) {
                this.queue.push(song)
            } else if (this.songLoop) {
                this.queue.unshift(song)
            }
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
        currentItem.once('downloaded', () => {
            this.download()
        })
        currentItem.download()
    }

    public loopSong(): string {
        if (this.player?.state.status !== AudioPlayerStatus.Playing && this.player?.state.status !== AudioPlayerStatus.Paused) {
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
        if (!this.player || this.queue.length < 1) {
            return 'Nothing is queued!'
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
        return this.player?.stop(true)
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

    public getNowPlaying(): InteractionReplyOptions {
        if (!this.nowPlaying) {
            return { content: 'Nothing has played yet!' }
        }
        return { embeds: [ this.nowPlaying ] }
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
        return this.queueLoop
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