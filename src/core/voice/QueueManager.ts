import { InteractionReplyOptions, TextChannel, VoiceChannel } from 'discord.js'
import { VoiceManager } from './VoiceManager'
import { AudioPlayerStatus } from '@discordjs/voice'
import { config } from '../utils/constants'
import { QueueItem } from './QueueItem'

export class QueueManager extends VoiceManager {

    private queue: QueueItem[]
    private downloadQueue: QueueItem[]
    private boundChannel: TextChannel
    private downloading: boolean
    private nowPlaying: QueueItem
    private queueLoop: boolean

    public constructor() {
        super()
        this.queue = []
        this.downloadQueue = []
        this.downloading = false
        this.queueLoop = false
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
        if (this.player?.state.status !== AudioPlayerStatus.Playing && this.player?.state.status !== AudioPlayerStatus.Paused) {
            this.checkSongStatus()
        }
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
        this.nowPlaying = song
        if (!song.looping) {
            this.boundChannel.send({ embeds: [ this.nowPlaying.generateEmbed() ] })
        }
        this.player.on('stateChange', (oldState, newState) => {
            if (newState.status !== AudioPlayerStatus.Idle) {
                return
            }
            this.player.removeAllListeners('stateChange')
            if (this.queueLoop) {
                this.queue.push(song)
            } else if (song.looping) {
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

    public loopSong(): InteractionReplyOptions {
        if (this.player?.state.status !== AudioPlayerStatus.Playing && this.player?.state.status !== AudioPlayerStatus.Paused) {
            return { content: 'Nothing is playing!' }
        }
        return this.nowPlaying.loop()
    }

    public loopQueue(): InteractionReplyOptions {
        if (this.player?.state.status !== AudioPlayerStatus.Playing && this.player?.state.status !== AudioPlayerStatus.Paused || this.queue.length < 1) {
            return { content: 'Nothing is queued!' }
        }
        if (this.queueLoop) {
            this.queueLoop = false
            return { content: 'No longer looping queue' }
        }
        this.queueLoop = true
        return { content: 'Now looping queue' }
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
        return { embeds: [ this.nowPlaying.generateEmbed() ] }
    }

    public getQueue(): QueueItem[][] {
        if (this.player?.state.status !== AudioPlayerStatus.Playing && this.player?.state.status !== AudioPlayerStatus.Paused) {
            return null
        }
        if (this.queue.length < 1) {
            return [ [ this.nowPlaying ] ]
        }
        const queueArray: QueueItem[][] = []
        for (let r = 0; r < Math.ceil(this.queue.length / 25); r++) {
            queueArray.push([])
            for (let i = -1; i < 25; i++) {
                if (r * 25 + i > this.queue.length - 1) {
                    break
                }
                if (r === 0 && i === -1) {
                    queueArray[r].push(this.nowPlaying)
                    continue
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
    }
}