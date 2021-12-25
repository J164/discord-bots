import { InteractionReplyOptions, VoiceChannel } from 'discord.js'
import { VoiceManager } from './VoiceManager.js'
import { AudioPlayerStatus } from '@discordjs/voice'
import { generateEmbed } from '../utils/generators.js'
import { setTimeout } from 'timers/promises'
import { raw } from '../utils/ytdl.js'
import internal from 'stream'

export interface QueueItem {
    readonly url: string
    readonly title: string
    readonly thumbnail: string
    readonly duration: number
    looping?: boolean
}

export class QueueManager {

    public readonly voiceManager: VoiceManager
    private queue: QueueItem[]
    private nowPlaying: QueueItem
    private queueLoop: boolean
    private queueLock: boolean
    private transitioning: boolean

    public constructor() {
        this.voiceManager = new VoiceManager()
        this.queue = []
        this.queueLoop = false
        this.queueLock = false
        this.transitioning = false
    }

    public async addToQueue(items: QueueItem[], position: number): Promise<void> {
        if (this.queueLock) {
            await setTimeout(200)
            return this.addToQueue(items, position)
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
        this.transitioning = true
        if (!await this.voiceManager.connect(voiceChannel) || this.queue.length < 1) {
            this.reset()
            return false
        }
        if (!this.voiceManager.isActive()) {
            this.playSong()
        }
        return true
    }

    private createStream(url: string): Promise<internal.Readable> {
        return new Promise((resolve: (value: internal.Readable) => void) => {
            const process = raw(url, {
                output: '-',
                quiet: true,
                format: 'bestaudio[ext=webm][acodec=opus]/bestaudio',
                limitRate: '100K'
            }, { stdio: [ 'ignore', 'pipe', 'ignore' ] })
            process.once('spawn', () => {
                resolve(process.stdout)
            })
        })
    }

    private async playSong(): Promise<void> {
        if (this.queue.length < 1) {
            this.transitioning = false
            return
        }

        if (this.queueLock) {
            await setTimeout(200)
            return this.playSong()
        }

        this.queueLock = true
        this.nowPlaying = this.queue.shift()
        this.queueLock = false

        await this.voiceManager.playStream(await this.createStream(this.nowPlaying.url))

        this.transitioning = false

        this.voiceManager.player.on('stateChange', async (oldState, newState) => {
            if (newState.status !== AudioPlayerStatus.Idle) {
                return
            }
            this.voiceManager.player.removeAllListeners('stateChange')

            this.transitioning = true

            if (this.queueLoop || this.nowPlaying.looping) {
                const endSong = async (): Promise<void> => {
                    if (this.queueLock) {
                        await setTimeout(200)
                        return endSong()
                    }
                    this.queueLock = true
                    if (this.queueLoop) {
                        this.queue.push(this.nowPlaying)
                    } else if (this.nowPlaying.looping) {
                        this.queue.unshift(this.nowPlaying)
                    }
                    this.queueLock = false
                }

                await endSong()
            }

            this.playSong()
        })
    }

    public async skipTo(index: number): Promise<void> {
        if (this.queueLock) {
            await setTimeout(200)
            return this.skipTo(index)
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
        if (this.nowPlaying.looping) {
            this.nowPlaying.looping = false
            return { embeds: [ generateEmbed('success', { title: 'No longer looping' }) ] }
        }
        this.nowPlaying.looping = true
        return { embeds: [ generateEmbed('success', { title: 'Now Looping' }) ] }
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
        return this.voiceManager.player?.stop()
    }

    public async shuffleQueue(): Promise<boolean> {
        if (this.queue.length < 1) {
            return false
        }
        if (this.queueLock) {
            await setTimeout(200)
            return this.shuffleQueue()
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
        const hour = Math.floor(this.nowPlaying.duration / 3600)
        const min = Math.floor((this.nowPlaying.duration % 3600) / 60)
        const sec = (this.nowPlaying.duration % 60)
        const embed = generateEmbed('info', {
            title: `Now Playing: ${this.nowPlaying.title} (${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec})`,
            fields: [ {
                name: 'URL:',
                value: this.nowPlaying.url
            } ],
            image: { url: this.nowPlaying.thumbnail }
        })
        if (this.nowPlaying.looping) {
            embed.footer = { text: 'Looping', iconURL: 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png' }
        }
        return { embeds: [ embed ] }
    }

    public async getQueue(): Promise<QueueItem[][]> {
        if (!this.voiceManager.isActive()) {
            return null
        }
        if (this.queue.length < 1) {
            return [ [ this.nowPlaying ] ]
        }
        const queueArray: QueueItem[][] = []
        if (this.queueLock) {
            await setTimeout(200)
            return this.getQueue()
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

    public isIdle(): boolean {
        return this.voiceManager.isIdle() && !this.transitioning
    }

    public reset(): void {
        this.voiceManager.reset()
        this.queue = []
        this.nowPlaying = null
        this.queueLoop = false
        this.queueLock = false
        this.transitioning = false
    }
}
