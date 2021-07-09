import { MessageEmbed, PartialTextBasedChannelFields, StreamDispatcher, VoiceChannel, VoiceConnection } from "discord.js"
import EventEmitter = require("events")
import { createReadStream, existsSync, unlinkSync, writeFileSync } from "fs"
import { home, genericEmbedResponse } from "./common"
const ffmpeg = require("fluent-ffmpeg")
const youtubedl = require("youtube-dl-exec")

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
            .on('error', function(err: any) {
                console.log(err)
            })
            .save(`${home}/music_files/playback/${this.id}.ogg`)
    }
}

export class VoiceManager {

    private queue: QueueItem[]
    private downloadQueue: QueueItem[]
    private boundChannel: PartialTextBasedChannelFields
    private downloading: boolean
    private playing: boolean
    private voiceConnection: VoiceConnection
    private nowPlaying: MessageEmbed
    private queueLoop: boolean
    private songLoop: boolean
    private streamDispatcher: StreamDispatcher

    public constructor() {
        this.queue = []
        this.downloadQueue = []
        this.downloading = false
        this.playing = false
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

    public async connect(channel: PartialTextBasedChannelFields, voiceChannel: VoiceChannel): Promise<void> {
        if (this.playing) {
            return
        }
        if (!voiceChannel.joinable || this.queue.length < 1) {
            channel.send('Something went wrong (Check if voice channel is joinable)')
            this.reset()
            return
        }
        this.playing = true
        this.voiceConnection = await voiceChannel.join()
        this.boundChannel = channel
        this.checkSongStatus()
    }

    private async checkSongStatus(): Promise<void> {
        if (this.queue.length < 1) {
            this.reset()
            return
        }
        this.playing = true
        const song = this.queue.shift()
        if (!song.isDownloaded()) {
            song.once("downloaded", () => {
                this.playSong(song)
            })
            return
        }
        this.playSong(song)
    }

    private async playSong(song: QueueItem): Promise<void> {
        //const stream = createReadStream(`${home}/music_files/playback/${song.id}.ogg`)
        //stream.once("end", () => console.log('close'))
        this.streamDispatcher = this.voiceConnection.play(`${home}/music_files/playback/${song.id}.mp3`)//, { type: 'ogg/opus' })
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
        currentItem.once("downloaded", () => {
            this.download()
        })
    }

    public pause(): boolean {
        if (!this.streamDispatcher || this.streamDispatcher.paused) {
            return false
        }
        this.streamDispatcher.pause(true)
        return true
    }

    public resume(): boolean {
        if (!this.streamDispatcher) {
            return false
        }
        this.streamDispatcher.resume()
        return true
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
        for (var i = this.queue.length - 1; i > 0; i--) {
            var randomIndex = Math.floor(Math.random() * (i + 1));
            var temp = this.queue[i];
            this.queue[i] = this.queue[randomIndex];
            this.queue[randomIndex] = temp;
        }
        return true
    }

    public stop(): boolean {
        this.reset()
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
                if ((r * 25) + i > this.queue.length - 1) {
                    break
                }
                queueArray[r].push(this.queue[(r * 25) + i])
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

    public checkIsIdle(): void {
        if (!this.playing) {
            this.stop()
        }
    }

    private reset(): void {
        this.queue = []
        this.downloadQueue = []
        this.boundChannel = null
        this.downloading = false
        this.playing = false
        this.voiceConnection?.disconnect()
        this.voiceConnection = null
        this.nowPlaying = null
        this.queueLoop = false
        this.songLoop = false
        this.streamDispatcher?.destroy()
        this.streamDispatcher = null
    }
}