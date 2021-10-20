import { InteractionReplyOptions, TextChannel, VoiceChannel } from 'discord.js'
import { VoiceManager } from './VoiceManager'
import { QueueItem } from './QueueItem'
import ytdl from 'ytdl-core'
import { AudioPlayerStatus } from '@discordjs/voice'

export class QueueManager {

    public voiceManager: VoiceManager
    private queue: QueueItem[]
    private boundChannel: TextChannel
    private nowPlaying: QueueItem
    private queueLoop: boolean
    private queueLock: boolean

    public constructor() {
        this.voiceManager = new VoiceManager()
        this.queue = []
        this.queueLoop = false
        this.queueLock = false
    }

    public addToQueue(duration: number, url: string, title: string, id: string, thumbnail: string): void {
        if (duration < 5400) {
            const song = new QueueItem(url, title, id, thumbnail, duration)
            this.queue.push(song)
        }
    }

    public async connect(voiceChannel: VoiceChannel): Promise<boolean> {
        if (!await this.voiceManager.connect(voiceChannel)) {
            return false
        }
        if (this.queue.length < 1) {
            this.reset()
            return false
        }
        if (!this.voiceManager.isActive()) {
            this.playSong()
        }
        return true
    }

    public bindChannel(channel: TextChannel): void {
        this.boundChannel = channel
    }

    private async playSong(): Promise<void> {
        if (this.queue.length < 1 || this.queueLock) {
            return
        }

        this.queueLock = true
        const song = this.queue.shift()

        let success = false

        try {
            success = await this.voiceManager.playStream(ytdl(song.url, {
                filter: format => format.container === 'webm' && format.audioSampleRate === '48000' && format.codecs === 'opus'
            }))
        } catch (err) {
            console.log(err)
        }

        if (!success) {
            this.boundChannel.send('Something went wrong while preparing song')
            this.queueLock = false
            return
        }

        this.nowPlaying = song
        if (!song.looping) {
            this.boundChannel.send({ embeds: [ this.nowPlaying.generateEmbed() ] })
        }
        this.voiceManager.player.on('stateChange', (oldState, newState) => {
            if (newState.status !== AudioPlayerStatus.Idle) {
                return
            }
            this.voiceManager.player.removeAllListeners('stateChange')
            if (this.queueLoop) {
                this.queue.push(song)
            } else if (song.looping) {
                this.queue.unshift(song)
            }
            this.playSong()
        })
        this.queueLock = false
    }

    public loopSong(): InteractionReplyOptions {
        if (!this.voiceManager.isActive()) {
            return { content: 'Nothing is playing!' }
        }
        return this.nowPlaying.loop()
    }

    public loopQueue(): InteractionReplyOptions {
        if (!this.voiceManager.isActive() || this.queue.length < 1) {
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
        this.queueLoop = false
        return true
    }

    public skip(): boolean {
        return this.voiceManager.player?.stop(true)
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
        if (!this.voiceManager.isActive()) {
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
        this.voiceManager.reset()
        this.queue = []
        this.boundChannel = null
        this.nowPlaying = null
        this.queueLoop = false
    }
}