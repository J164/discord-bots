import { MessageEmbedOptions, VoiceChannel } from 'discord.js'
import { VoiceManager } from './voice-manager.js'
import { AudioPlayerStatus } from '@discordjs/voice'
import { generateEmbed } from '../utils/generators.js'
import { setTimeout } from 'node:timers/promises'
import { createStream } from '../modules/ytdl.js'
import { Readable } from 'node:stream'
import { ChildProcessByStdio } from 'node:child_process'
import { setInterval } from 'node:timers'

export interface QueueItem {
    readonly url: string
    readonly title: string
    readonly thumbnail: string
    readonly duration: string
    looping?: boolean
}

export class QueueManager {

    private readonly _voiceManager: VoiceManager
    private _script: ChildProcessByStdio<null, Readable, null>
    private _queue: QueueItem[]
    private _nowPlaying: QueueItem
    private _queueLoop: boolean
    private _queueLock: boolean
    private _transitioning: boolean

    public constructor() {
        this._voiceManager = new VoiceManager(true)
        this._queue = []
        this._queueLoop = false
        this._queueLock = false
        this._transitioning = false

        setInterval(() => { if (this._isIdle()) void this.reset() }, 300_000)
    }

    public get nowPlaying(): MessageEmbedOptions {
        return this._nowPlaying
            ? generateEmbed('info', {
                title: `Now Playing: ${this._nowPlaying.title} (${this._nowPlaying.duration})`,
                fields: [ {
                    name: 'URL:',
                    value: this._nowPlaying.url,
                } ],
                image: { url: this._nowPlaying.thumbnail },
                footer: this._nowPlaying.looping ? { text: 'Looping', iconURL: 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png' } : {},
            })
            : generateEmbed('error', { title: 'Nothing has played yet!' })
    }

    public get queue(): QueueItem[] {
        return this._queue
    }

    public get queueLoop(): boolean {
        return this._queueLoop
    }

    public async addToQueue(items: QueueItem[], position: number): Promise<void> {
        while (this._queueLock) await setTimeout(200)
        this._queueLock = true

            if (position === -1 || position >= this._queue.length) {
                this._queue.push(...items)
                this._queueLock = false
                return
            }
            if (position === 0) {
                this._queue.unshift(...items)
                this._queueLock = false
                return
            }
            this._queue.splice(position, 0, ...items)

        this._queueLock = false
    }

    public async connect(voiceChannel: VoiceChannel): Promise<void> {
        if (this._isActive()) return

        this._transitioning = true
        await this._voiceManager.connect(voiceChannel)
        void this._playSong()
    }

    private async _playSong(): Promise<void> {
        while (this._queueLock) await setTimeout(200)
        this._queueLock = true

            if (this._queue.length === 0) {
                this._queueLock = false
                this._transitioning = false
                return
            }

            this._nowPlaying = this._queue.shift()

        this._queueLock = false

        this._script = createStream(this._nowPlaying.url, { format: 'bestaudio[ext=webm][acodec=opus]/bestaudio[ext=ogg][acodec=opus]/bestaudio' })
        await this._voiceManager.playStream(this._script.stdout)

        this._transitioning = false

        this._voiceManager.player.on('stateChange', async (oldState, newState) => {
            if (newState.status !== AudioPlayerStatus.Idle) return
            this._voiceManager.player.removeAllListeners('stateChange')

            this._transitioning = true
            this._script.kill()

            if (this._queueLoop || this._nowPlaying.looping) {
                while (this._queueLock) await setTimeout(200)
                this._queueLock = true

                    if (this._queueLoop) {
                        this._queue.push(this._nowPlaying)
                    } else if (this._nowPlaying.looping) {
                        this._queue.unshift(this._nowPlaying)
                    }

                this._queueLock = false
            }

            void this._playSong()
        })
    }

    public async skipTo(index: number): Promise<void> {
        while (this._queueLock) await setTimeout(200)
        this._queueLock = true

            if (this._queue.length === 0) {
                this._queueLock = false
                return
            }

            index >= this._queue.length
                ? this._queue.unshift(this._queue.pop())
                : this._queue.unshift(this._queue.splice(index - 1, 1)[0])

        this._queueLock = false
        this.skip()
    }

    public loopSong(): MessageEmbedOptions {
        if (!this._isActive()) {
            return generateEmbed('error', { title: 'Nothing is playing!' })
        }

        if (this._nowPlaying.looping) {
            this._nowPlaying.looping = false
            return generateEmbed('success', { title: 'No longer looping' })
        }
        this._nowPlaying.looping = true
        return generateEmbed('success', { title: 'Now Looping' })
    }

    public loopQueue(): MessageEmbedOptions {
        if (!this._isActive() || this._queue.length === 0) {
            return generateEmbed('error', { title: 'Nothing is queued!' })
        }

        if (this._queueLoop) {
            this._queueLoop = false
            return generateEmbed('success', { title: 'No longer looping queue' })
        }
        this._queueLoop = true
        return generateEmbed('success', { title: 'Now looping queue' })
    }

    public clear(): boolean {
        if (this._queue.length === 0) {
            return false
        }

        this._queue = []
        this._queueLoop = false
        return true
    }

    public skip(): boolean {
        return this._voiceManager.player?.stop()
    }

    public pause(): boolean {
        return this._voiceManager.pause()
    }

    public resume(): boolean {
        return this._voiceManager.resume()
    }

    public async shuffleQueue(): Promise<boolean> {
        while (this._queueLock) await setTimeout(200)
        this._queueLock = true

            if (this._queue.length === 0) {
                this._queueLock = false
                return false
            }

            for (let index = this._queue.length - 1; index > 0; index--) {
                const randomIndex = Math.floor(Math.random() * (index + 1))
                const temporary = this._queue[index]
                this._queue[index] = this._queue[randomIndex]
                this._queue[randomIndex] = temporary
            }

        this._queueLock = false
        return true
    }

    public async getPaginatedQueue(): Promise<QueueItem[][]> {
        if (!this._isActive()) return

        while (this._queueLock) await setTimeout(200)
        this._queueLock = true

            if (this._queue.length === 0) {
                this._queueLock = false
                return [ [ this._nowPlaying ] ]
            }
            const queueArray: QueueItem[][] = []
            for (let r = 0; r < Math.ceil(this._queue.length / 25); r++) {
                queueArray.push([])
                for (let index = -1; index < 25; index++) {
                    if (r * 25 + index > this._queue.length - 1) {
                        break
                    }
                    if (r === 0 && index === -1) {
                        queueArray[r].push(this._nowPlaying)
                        continue
                    }
                    queueArray[r].push(this._queue[r * 25 + index])
                }
            }

        this._queueLock = false
        return queueArray
    }

    private _isActive(): boolean {
        return this._voiceManager.player?.state.status === AudioPlayerStatus.Playing || this._voiceManager.player?.state.status === AudioPlayerStatus.Paused
    }

    private _isIdle(): boolean {
        return this._voiceManager.isIdle() && !this._transitioning
    }

    public async reset(): Promise<void> {
        while (this._queueLock) await setTimeout(200)
        this._queueLock = true

            this._queue = []
            this._voiceManager.reset()
            this._script?.kill()
            this._script = undefined
            this._nowPlaying = undefined
            this._queueLoop = false
            this._transitioning = false

        this._queueLock = false
    }
}
