import { InteractionReplyOptions, TextChannel, VoiceChannel } from 'discord.js'
import { VoiceManager } from './VoiceManager'
import { QueueItem } from './QueueItem'
import ytdl from 'ytdl-core'
import { AudioPlayerStatus } from '@discordjs/voice'
import { generateEmbed } from '../utils/commonFunctions'

export class QueueManager {

    public readonly voiceManager: VoiceManager
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

    public addToQueue(items: QueueItem[], position: number): void {
        if (this.queueLock) {
            setTimeout(() => { this.addToQueue(items, position) }, 200)
        }
        this.queueLock = true
        if (position >= this.queue.length || position < 0) {
            this.queue = this.queue.concat(items)
            this.queueLock = false
            return
        }
        if (position === 0) {
            this.queue = this.queue.reverse().concat(items.reverse()).reverse()
            this.queueLock = false
            return
        }
        const queueEnd = this.queue.splice(position)
        this.queue = this.queue.concat(items, queueEnd)
        this.queueLock = false
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
        if (this.queue.length < 1) {
            return
        }

        if (this.queueLock) {
            setTimeout(() => { this.playSong() }, 200)
        }

        this.queueLock = true
        const song = this.queue.shift()
        this.queueLock = false

        const success = await this.voiceManager.playStream(ytdl(song.url, {
            filter: format => format.container === 'webm' && format.audioSampleRate === '48000' && format.codecs === 'opus',
            highWaterMark: 52428800
        }))

        if (!success) {
            this.boundChannel.send({ embeds: [ generateEmbed('error', { title: 'Something went wrong while preparing song'}) ] })
            this.playSong()
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

            if (this.queueLock) {
                setTimeout(() => { this.playSong() }, 200)
            }
            this.queueLock = true
            if (this.queueLoop) {
                this.queue.push(song)
            } else if (song.looping) {
                this.queue.unshift(song)
            }
            this.queueLock = false
            this.playSong()
        })
    }

    public skipTo(index: number): void {
        if (this.queueLock) {
            setTimeout(() => { this.skipTo(index) }, 10000)
        }

        this.queueLock = true
        const item = this.queue.splice(index - 1, 1)
        this.queue.unshift(item[0])
        this.queueLock = false

        this.skip()
    }

    public loopSong(): InteractionReplyOptions {
        if (!this.voiceManager.isActive()) {
            return { embeds: [ generateEmbed('error', { title: 'Nothing is playing!' }) ] }
        }
        return this.nowPlaying.loop()
    }

    public loopQueue(): InteractionReplyOptions {
        if (!this.voiceManager.isActive() || this.queue.length < 1) {
            return { embeds: [ generateEmbed('error', { title: 'Nothing is queued!' }) ] }
        }
        if (this.queueLoop) {
            this.queueLoop = false
            return { embeds: [ generateEmbed('success', { title: 'No longer looping queue' }) ] }
        }
        this.queueLoop = true
        return { embeds: [ generateEmbed('success', { title: 'Now looping queue' }) ] }
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
        if (this.queueLock) {
            setTimeout(() => { this.playSong() }, 200)
        }
        this.queueLock = true
        for (let i = this.queue.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1))
            const temp = this.queue[i]
            this.queue[i] = this.queue[randomIndex]
            this.queue[randomIndex] = temp
        }
        this.queueLock = false
        return true
    }

    public getNowPlaying(): InteractionReplyOptions {
        if (!this.nowPlaying) {
            return { embeds: [ generateEmbed('error', { title: 'Nothing has played yet!' }) ] }
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
        if (this.queueLock) {
            setTimeout(() => { this.playSong() }, 200)
        }
        this.queueLock = true
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
        this.queueLock = false
        return queueArray
    }

    public getFlatQueue(): QueueItem[] {
        return this.queue
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